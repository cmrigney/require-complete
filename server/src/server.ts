/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
'use strict';

import {
	IPCMessageReader, IPCMessageWriter,
	createConnection, IConnection, TextDocumentSyncKind,
	TextDocuments, TextDocument, Diagnostic, DiagnosticSeverity,
	InitializeParams, InitializeResult, TextDocumentPositionParams,
	CompletionItem, CompletionItemKind, Range
} from 'vscode-languageserver';

import * as path from 'path';
import * as _ from 'lodash';
import * as fs from 'fs';
import { builtins } from './builtins';
import { NodeModuleCompletion } from './node-module-completion';
import { FileDirList } from './file-dir-list';

let nodeModules: NodeModuleCompletion[] = [];
let localModules: NodeModuleCompletion[] = [];
let lastFile: string = null;
let lastPath: string = null;
let lastFile2: string = null;
let lastPath2: string = null;

// Create a connection for the server. The connection uses Node's IPC as a transport
let connection: IConnection = createConnection(new IPCMessageReader(process), new IPCMessageWriter(process));

// Create a simple text document manager. The text document manager
// supports full document sync only
let documents: TextDocuments = new TextDocuments();
// Make the text document manager listen on the connection
// for open, change and close text document events
documents.listen(connection);

// After the server has started the client sends an initialize request. The server receives
// in the passed params the rootPath of the workspace plus the client capabilities. 
let workspaceRoot: string;
connection.onInitialize((params): InitializeResult => {
	workspaceRoot = params.rootPath;
	return {
		capabilities: {
			// Tell the client that the server works in FULL text document sync mode
			textDocumentSync: documents.syncKind,
			// Tell the client that the server support code complete
			completionProvider: {
				resolveProvider: true,
				triggerCharacters: [`require("`, `require('`, 'require(`'],
			}
		}
	}
});


// This handler provides the initial list of the completion items.
connection.onCompletion((textDocumentPosition: TextDocumentPositionParams): CompletionItem[] => {
	// The pass parameter contains the position of the text document in 
	// which code complete got requested. For the example we ignore this
	// info and always provide the same completion items.
	let file = textDocumentPosition.textDocument.uri.replace('%3A', ':').replace('file:///', '');

	let isWin = /^win/.test(process.platform);

	if (isWin) {
		file = file.charAt(0).toUpperCase() + file.slice(1);
	}
	else {
		file = '/' + file;
	}


	let document = documents.get(textDocumentPosition.textDocument.uri);
	let offset = document.offsetAt(textDocumentPosition.position);

	let text = document.getText();
	let pretext = 'require("';
	if (offset - pretext.length < 0) {
		return [];
	}

	let requireOffset = text.lastIndexOf(pretext, offset);
	let requireOffset2 = text.lastIndexOf(pretext.replace('"', "'"), offset);
	requireOffset = Math.max(requireOffset, requireOffset2);
	if (requireOffset < 0)
		return;


	let realOffset = text.lastIndexOf("'", offset - 1);
	let realOffset2 = text.lastIndexOf('"', offset - 1);
	realOffset = Math.max(realOffset, realOffset2);
	if (realOffset < 0 || realOffset !== requireOffset + 8)
		return [];

	if (text[offset] !== '"' && text[offset] !== "'")
		return [];
	if (document.positionAt(requireOffset).line !== textDocumentPosition.position.line)
		return [];

	let existingText = text.substring(realOffset + 1, offset);

	let result: NodeModuleCompletion[] = [];
	_.forEach(builtins, (b) => {
		if (!existingText.startsWith('.'))
			result.push(_.pick(b, ['label', 'kind', 'data']) as NodeModuleCompletion);
	});

	generateFromNodeModules(file, existingText);

	_.forEach(nodeModules, (m) => {
		result.push(_.pick(m, ['label', 'kind', 'data']) as NodeModuleCompletion);
	});

	generateFromLocal(file, existingText, realOffset + 1, document);

	_.forEach(localModules, (m) => {
		result.push(_.pick(m, ['label', 'kind', 'data', 'sortText']) as NodeModuleCompletion);
	});

	return result as CompletionItem[];
});

// This handler resolve additional information for the item selected in
// the completion list.
connection.onCompletionResolve((item: CompletionItem): CompletionItem => {
	var val = _.find(builtins, (b) => b.data == item.data) || _.find(nodeModules, (b) => b.data == item.data) || _.find(localModules, (b) => b.data == item.data);
	if (val) {
		item.detail = val.detail;
		item.documentation = val.documentation;
		item.insertText = val.insertText;
		item.sortText = val.sortText;
	}
	return item;
});

let t: Thenable<string>;

/*
connection.onDidOpenTextDocument((params) => {
	// A text document got opened in VSCode.
	// params.textDocument.uri uniquely identifies the document. For documents store on disk this is a file URI.
	// params.textDocument.text the initial full content of the document.
	connection.console.log(`${params.textDocument.uri} opened.`);
});

connection.onDidChangeTextDocument((params) => {
	// The content of a text document did change in VSCode.
	// params.textDocument.uri uniquely identifies the document.
	// params.contentChanges describe the content changes to the document.
	connection.console.log(`${params.textDocument.uri} changed: ${JSON.stringify(params.contentChanges)}`);
});

connection.onDidCloseTextDocument((params) => {
	// A text document got closed in VSCode.
	// params.textDocument.uri uniquely identifies the document.
	connection.console.log(`${params.textDocument.uri} closed.`);
});
*/

// Listen on the connection
connection.listen();


function getDirectories(srcpath: string) : string[] {
	return fs.readdirSync(srcpath).filter((file) => {
		return fs.statSync(path.join(srcpath, file)).isDirectory();
	});
}

function generateFromNodeModules(file: string, existingPath: string) {
	if (file === lastFile && existingPath === lastPath) {
		return;
	}

	lastFile = file;
	lastPath = existingPath;
	nodeModules = [];

	if (existingPath.startsWith('.'))
		return;

	var currentPath = path.join(file, '../');
	while (currentPath.length >= workspaceRoot.length + 1) {
		var nodeMods = path.join(currentPath, 'node_modules/');
		try {
			fs.accessSync(nodeMods, fs.constants.R_OK);
			let directories = getDirectories(nodeMods);
			_.forEach(directories, (d) => {
				var name = path.basename(d);
				if (name[0] === '.')
					return;
				let documentation: string;
				try {
					let packageJson = require(path.join(nodeMods, d, 'package.json'));
					documentation = packageJson.description;
				}
				catch (err) { }

				handleModule(name, existingPath, nodeModules, documentation);
			});
			return;
		}
		catch (err) {
		}
		currentPath = path.join(currentPath, '../');
	}
}

function listJsFilesAndDirectories(dirPath: string): FileDirList {
	try {
		fs.accessSync(dirPath, fs.constants.R_OK);
	}
	catch (err) {
		return {
			dirs: [],
			files: []
		};
	}

	dirPath = dirPath.replace(/\\/g, '/');
	if (dirPath[dirPath.length - 1] != '/')
		dirPath += '/';

	let listing = fs.readdirSync(dirPath);

	let dirs: string[] = [];
	let files: string[] = [];
	_.forEach(listing, (l) => {
		if (fs.statSync(path.join(dirPath, l)).isDirectory()) {
			if (!l.startsWith('node_modules') && !l.startsWith('bower_components') && !l.startsWith('.'))
				dirs.push(path.join(dirPath, l));
		}
		else if (l.endsWith('.js') || l.endsWith('.json')) {
			files.push(path.join(dirPath, l));
		}
	});
	return {
		dirs: dirs,
		files: files
	};
}

function findFirstDiff(a: string, b: string): number {
	let i = 0;
	let lastMatchingSlash = 0;
	for (i = 0; i < a.length && i < b.length; i++) {
		if (a[i] === b[i] && a[i] === '/') {
			lastMatchingSlash = i;
		}
		else if (a[i] !== b[i])
			break;
	}

	if (i === a.length && i === b.length)
		return -1;
	else {
		return lastMatchingSlash + 1;
	}
}

function ensureEndingSlash(a: string): string {
	a = a.replace(/\\/g, '/');
	if (a[a.length - 1] !== '/') {
		a += '/';
	}
	return a;
}

function generateFromLocal(file: string, existingPath: string, startPos: number, document: TextDocument) {
	if (file === lastFile2 && existingPath === lastPath2) {
		return;
	}

	lastFile2 = file;
	lastPath2 = existingPath;
	localModules = [];

	let currentPath = path.join(file, '../').replace(/\\/g, '/');
	let workingPath = ensureEndingSlash(path.dirname(file));

	let replaceRange = Range.create(document.positionAt(startPos), document.positionAt(startPos + existingPath.length));

	recursiveReadDir(workspaceRoot);

	function getRelatedPath(f: string): string {
		let filePath = ensureEndingSlash(path.dirname(f));
		filePath = filePath.charAt(0).toUpperCase() + filePath.slice(1);
		let filename = path.basename(f);
		let firstDiff = findFirstDiff(filePath, workingPath);
		if (firstDiff < 0) {
			return './' + filename;
		}

		let workingSubPath = workingPath.substring(firstDiff);
		let fileSubPath = filePath.substring(firstDiff);

		let prepend = '';
		if (workingSubPath.length === 0) {
			prepend += './';
		}

		while (workingSubPath.length > 0) {
			let slashIdx = workingSubPath.lastIndexOf('/');
			if (slashIdx < 0) {
				break;
			}
			prepend += '../';
			workingSubPath = workingSubPath.substring(0, slashIdx);
		}

		prepend += fileSubPath;

		return prepend + filename;
	}


	function recursiveReadDir(pth: string) {
		let list = listJsFilesAndDirectories(pth);

		_.forEach(list.files, (f) => {
			let name = getRelatedPath(f);
			handleModule(name, existingPath, localModules);
		});

		_.forEach(list.dirs, (dir) => {
			recursiveReadDir(dir);
		});
	}
}

function handleModule(name: string, existingPath: string, modules: NodeModuleCompletion[], docs?: string) {
	let contains = name.indexOf(existingPath) >= 0;
	let startsWithDotSlash = name.startsWith('./') && existingPath.startsWith('./');
	if ((contains && !startsWithDotSlash) || startsWithDotSlash) {
		let insertText = (name.startsWith(existingPath) ? (getPrecedingText(existingPath) + name.substring(existingPath.length)) : name);
		modules.push({
			label: name,
			kind: CompletionItemKind.Module,
			data: name,
			detail: name,
			insertText: insertText,
			sortText: insertText,
			documentation: docs || ''
		});
	}
}

function getPrecedingText(text: string): string {
	let lastIdx = text.replace(/[\./\\:']/g, '-').lastIndexOf('-');
	if (lastIdx < 0)
		lastIdx = 0;
	else
		lastIdx += 1; //Don't include the character
	return text.substr(lastIdx);
}
