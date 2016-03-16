'use strict';

// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
var vscode = require('vscode');
var languageClient = require('vscode-languageclient');
var path = require('path');

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate(context) {
    
	let serverModule = context.asAbsolutePath(path.join('server', 'server.js'));
    let debugOptions = { execArgv: ['--nolazy', '--debug=6004'] };
    
    let serverOptions = {
        run: {
            module: serverModule,
            transport: languageClient.TransportKind.ipc
        },
        debug: {
            module: serverModule,
            transport: languageClient.TransportKind.ipc,
            options: debugOptions
        }
    };
    
    let clientOptions = {
        documentSelector: ['javascript']
    };
    
    let disposable = new languageClient.LanguageClient('Require complete', serverOptions, clientOptions).start();

	context.subscriptions.push(disposable);
}
exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() {
}
exports.deactivate = deactivate;