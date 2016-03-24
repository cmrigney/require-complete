'use strict';

let fs = require('fs');
let _ = require('lodash');
let path = require('path');
let languageServer = require('vscode-languageserver');

let connection = languageServer.createConnection(new languageServer.IPCMessageReader(process), new languageServer.IPCMessageWriter(process));

let documents = new languageServer.TextDocuments();

documents.listen(connection);

var workspaceRoot;

connection.onInitialize((params) => {
    workspaceRoot = params.rootPath;
    return {
        capabilities: {
            // Tell the client that the server works in FULL text document sync mode
            textDocumentSync: documents.syncKind,
            // Tell the client that the server support code complete
            completionProvider: {
                resolveProvider: true
            }
        }
    };
});

let builtIns = [{
        label: "assert",
        kind: languageServer.CompletionItemKind.Module,
        data: "assert",
        detail: "assert",
        documentation: "The assert module provides a simple set of assertion tests that can be used to test invariants."
    },
	{
        label: "buffer",
        kind: languageServer.CompletionItemKind.Module,
        data: "buffer",
        detail: "buffer",
        documentation: "The Buffer class was introduced as part of the Node.js API to make it possible to interact with octet streams in the context of things like TCP streams and file system operations."
    },
	{
        label: "child_process",
        kind: languageServer.CompletionItemKind.Module,
        data: "child_process",
        detail: "child_process",
        documentation: "The child_process module provides the ability to spawn child processes in a manner that is similar, but not identical, to popen(3)."
    },
	{
        label: "cluster",
        kind: languageServer.CompletionItemKind.Module,
        data: "cluster",
        detail: "cluster",
        documentation: "A single instance of Node.js runs in a single thread. To take advantage of multi-core systems the user will sometimes want to launch a cluster of Node.js processes to handle the load. The cluster module allows you to easily create child processes that all share server ports."
    },
	{
        label: "console",
        kind: languageServer.CompletionItemKind.Module,
        data: "console",
        detail: "console",
        documentation: "The console module provides a simple debugging console that is similar to the JavaScript console mechanism provided by web browsers."
    },
	{
        label: "constants",
        kind: languageServer.CompletionItemKind.Module,
        data: "constants",
        detail: "constants",
        documentation: undefined
    },
	{
        label: 'crypto',
        kind: languageServer.CompletionItemKind.Module,
        data: 'crypto',
        detail: 'Crypto',
        documentation: "The crypto module provides cryptographic functionality that includes a set of wrappers for OpenSSL's hash, HMAC, cipher, decipher, sign and verify functions."
    },
	{
        label: "dgram",
        kind: languageServer.CompletionItemKind.Module,
        data: "dgram",
        detail: "dgram",
        documentation: "The dgram module provides an implementation of UDP Datagram sockets."
    },
	{
        label: "dns",
        kind: languageServer.CompletionItemKind.Module,
        data: "dns",
        detail: "dns",
        documentation: "The dns module contains functions belonging to two different categories: 1) Functions that use the underlying operating system facilities to perform name resolution, and that do not necessarily perform any network communication. This category contains only one function: dns.lookup(). Developers looking to perform name resolution in the same way that other applications on the same operating system behave should use dns.lookup(). 2) Functions that connect to an actual DNS server to perform name resolution, and that always use the network to perform DNS queries. This category contains all functions in the dns module except dns.lookup(). These functions do not use the same set of configuration files used by dns.lookup() (e.g. /etc/hosts). These functions should be used by developers who do not want to use the underlying operating system's facilities for name resolution, and instead want to always perform DNS queries."
    },
	{
        label: "domain",
        kind: languageServer.CompletionItemKind.Module,
        data: "domain",
        detail: "domain",
        documentation: "This module is pending deprecation. Once a replacement API has been finalized, this module will be fully deprecated. Most end users should not have cause to use this module. Users who absolutely must have the functionality that domains provide may rely on it for the time being but should expect to have to migrate to a different solution in the future. Domains provide a way to handle multiple different IO operations as a single group. If any of the event emitters or callbacks registered to a domain emit an 'error' event, or throw an error, then the domain object will be notified, rather than losing the context of the error in the process.on('uncaughtException') handler, or causing the program to exit immediately with an error code."
    },
	{
        label: "events",
        kind: languageServer.CompletionItemKind.Module,
        data: "events",
        detail: "events",
        documentation: "Much of the Node.js core API is built around an idiomatic asynchronous event-driven architecture in which certain kinds of objects (called 'emitters') periodically emit named events that cause Function objects ('listeners') to be called. "
    },
	{
        label: 'fs',
        kind: languageServer.CompletionItemKind.Module,
        data: 'fs',
        detail: 'File System',
        documentation: 'File I/O is provided by simple wrappers around standard POSIX functions'
    },
	{
        label: "http",
        kind: languageServer.CompletionItemKind.Module,
        data: "http",
        detail: "http",
        documentation: "The HTTP interfaces in Node.js are designed to support many features of the protocol which have been traditionally difficult to use. In particular, large, possibly chunk-encoded, messages. The interface is careful to never buffer entire requests or responses--the user is able to stream data."
    },
	{
        label: "https",
        kind: languageServer.CompletionItemKind.Module,
        data: "https",
        detail: "https",
        documentation: "HTTPS is the HTTP protocol over TLS/SSL. In Node.js this is implemented as a separate module."
    },
	{
        label: "module",
        kind: languageServer.CompletionItemKind.Module,
        data: "module",
        detail: "module",
        documentation: "Node.js has a simple module loading system. In Node.js, files and modules are in one-to-one correspondence."
    },
	{
        label: "net",
        kind: languageServer.CompletionItemKind.Module,
        data: "net",
        detail: "net",
        documentation: "The net module provides you with an asynchronous network wrapper. It contains functions for creating both servers and clients (called streams)."
    },
	{
        label: "os",
        kind: languageServer.CompletionItemKind.Module,
        data: "os",
        detail: "os",
        documentation: "Provides a few basic operating-system related utility functions."
    },
	{
        label: "path",
        kind: languageServer.CompletionItemKind.Module,
        data: "path",
        detail: "path",
        documentation: "This module contains utilities for handling and transforming file paths. Almost all these methods perform only string transformations. The file system is not consulted to check whether paths are valid."
    },
	{
        label: "process",
        kind: languageServer.CompletionItemKind.Module,
        data: "process",
        detail: "process",
        documentation: "The process object is a global object and can be accessed from anywhere. It is an instance of EventEmitter."
    },
	{
        label: "punycode",
        kind: languageServer.CompletionItemKind.Module,
        data: "punycode",
        detail: "punycode",
        documentation: "Performs string conversion"
    },
	{
        label: "querystring",
        kind: languageServer.CompletionItemKind.Module,
        data: "querystring",
        detail: "querystring",
        documentation: "This module provides utilities for dealing with query strings."
    },
	{
        label: "readline",
        kind: languageServer.CompletionItemKind.Module,
        data: "readline",
        detail: "readline",
        documentation: "Readline allows reading of a stream (such as process.stdin) on a line-by-line basis."
    },
	{
        label: "repl",
        kind: languageServer.CompletionItemKind.Module,
        data: "repl",
        detail: "repl",
        documentation: "A Read-Eval-Print-Loop (REPL) is available both as a standalone program and easily includable in other programs. The REPL provides a way to interactively run JavaScript and see the results. It can be used for debugging, testing, or just trying things out."
    },
	{
        label: "stream",
        kind: languageServer.CompletionItemKind.Module,
        data: "stream",
        detail: "stream",
        documentation: "A stream is an abstract interface implemented by various objects in Node.js. For example a request to an HTTP server is a stream, as is process.stdout. Streams are readable, writable, or both. All streams are instances of EventEmitter."
    },
	{
        label: "string_decoder",
        kind: languageServer.CompletionItemKind.Module,
        data: "string_decoder",
        detail: "string_decoder",
        documentation: "StringDecoder decodes a buffer to a string. It is a simple interface to buffer.toString() but provides additional support for utf8."
    },
	{
        label: "timers",
        kind: languageServer.CompletionItemKind.Module,
        data: "timers",
        detail: "timers",
        documentation: "All of the timer functions are globals. You do not need to require() this module in order to use them."
    },
	{
        label: "tls",
        kind: languageServer.CompletionItemKind.Module,
        data: "tls",
        detail: "tls",
        documentation: "The tls module uses OpenSSL to provide Transport Layer Security and/or Secure Socket Layer: encrypted stream communication."
    },
	{
        label: "tty",
        kind: languageServer.CompletionItemKind.Module,
        data: "tty",
        detail: "tty",
        documentation: "The tty module houses the tty.ReadStream and tty.WriteStream classes. In most cases, you will not need to use this module directly."
    },
	{
        label: "url",
        kind: languageServer.CompletionItemKind.Module,
        data: "url",
        detail: "url",
        documentation: "This module has utilities for URL resolution and parsing."
    },
	{
        label: "util",
        kind: languageServer.CompletionItemKind.Module,
        data: "util",
        detail: "util",
        documentation: "The util module is primarily designed to support the needs of Node.js's internal APIs. Many of these utilities are useful for your own programs. If you find that these functions are lacking for your purposes, however, you are encouraged to write your own utilities."
    },
	{
        label: "v8",
        kind: languageServer.CompletionItemKind.Module,
        data: "v8",
        detail: "v8",
        documentation: "This module exposes events and interfaces specific to the version of V8 built with Node.js. These interfaces are subject to change by upstream and are therefore not covered under the stability index."
    },
	{
        label: "vm",
        kind: languageServer.CompletionItemKind.Module,
        data: "vm",
        detail: "vm",
        documentation: "JavaScript code can be compiled and run immediately or compiled, saved, and run later."
    },
	{
        label: "zlib",
        kind: languageServer.CompletionItemKind.Module,
        data: "zlib",
        detail: "zlib",
        documentation: "This provides bindings to Gzip/Gunzip, Deflate/Inflate, and DeflateRaw/InflateRaw classes. Each class takes the same options, and is a readable/writable Stream."
    }
];

var nodeModules = [];
var localModules = [];
var lastFile = null;
var lastPath = null;
var lastFile2 = null;
var lastPath2 = null;

function getDirectories(srcpath) {
  return fs.readdirSync(srcpath).filter(function(file) {
    return fs.statSync(path.join(srcpath, file)).isDirectory();
  });
}

function generateFromNodeModules(file, existingPath) {
    if(file === lastFile && existingPath === lastPath) {
        return;
    }
    
    lastFile = file;
    lastPath = existingPath;
    nodeModules = [];
    
    if(existingPath.startsWith('.'))
        return;
    
    var currentPath = path.join(file, '../');
    while(currentPath.length >= workspaceRoot.length + 1) {
        var nodeMods = path.join(currentPath, 'node_modules/');
        try {
            fs.accessSync(nodeMods, fs.R_OK);
            var directories = getDirectories(nodeMods);
            _.forEach(directories, (d) => {
                var name = path.basename(d);
                if(name[0] === '.')
                    return;
                let documentation;
                try {
                    let packageJson = require(path.join(nodeMods, d, 'package.json'));
                    documentation = packageJson.description;
                }
                catch(err) {}
                
                nodeModules.push({
                    label: name,
                    kind: languageServer.CompletionItemKind.Module,
                    data: name,
                    detail: name,
                    documentation: documentation || ''
                });
            });
            return;
        }
        catch(err) {
        }
        currentPath = path.join(currentPath, '../');
    }
}

function listJsFilesAndDirectories(dirPath) {
    try {
        fs.accessSync(dirPath, fs.R_OK);
    }
    catch(err) {
        return {
            dirs: [],
            files: []
        };
    }
    
    dirPath = dirPath.replaceAll('\\', '/');
    if(dirPath[dirPath.length - 1] != '/')
        dirPath += '/';

    var listing = fs.readdirSync(dirPath);
    
    var dirs = [];
    var files = [];
    _.forEach(listing, (l) => {
        if(fs.statSync(path.join(dirPath, l)).isDirectory()) {
            if(!l.startsWith('node_modules') && !l.startsWith('bower_components') && !l.startsWith('.'))
                dirs.push(path.join(dirPath, l));
        }
        else if(l.endsWith('.js') || l.endsWith('.json')) {
            files.push(path.join(dirPath, l));
        }
    });
    return {
        dirs: dirs,
        files: files
    };
}

function findFirstDiff(a, b) {
    var i = 0;
    var lastMatchingSlash = 0;
    for(i = 0; i < a.length && i < b.length; i++) {
        if(a[i] === b[i] && a[i] === '/') {
            lastMatchingSlash = i;
        }
        else if(a[i] !== b[i])
            break;
    }
    
    if(i === a.length && i === b.length)
        return -1;
    else{
        return lastMatchingSlash + 1;
    }
}

String.prototype.replaceAll = function(search, replacement) {
    var target = this;
    if(search === '\\') {
        search = '\\\\';
    }
    return target.replace(new RegExp(search, 'g'), replacement);
};

function ensureEndingSlash(a) {
    a = a.replaceAll('\\', '/');
    if(a[a.length - 1] !== '/') {
        a += '/';
    }
    return a;
}

function generateFromLocal(file, existingPath, startPos, document) {
    if(file === lastFile2 && existingPath === lastPath2) {
        return;
    }
    
    lastFile2 = file;
    lastPath2 = existingPath;
    localModules = [];
    
    var currentPath = path.join(file, '../').replaceAll('\\', '/');
    var workingPath = ensureEndingSlash(path.dirname(file));
    
    var replaceRange = languageServer.Range.create(document.positionAt(startPos), document.positionAt(startPos+existingPath.length));
    
    recursiveReadDir(workspaceRoot);
    
    function getRelatedPath(f) {
        var filePath = ensureEndingSlash(path.dirname(f));
        var filename = path.basename(f);
        var firstDiff = findFirstDiff(filePath, workingPath);
        if(firstDiff < 0) {
            return './' + filename;
        }
        
        var workingSubPath = workingPath.substring(firstDiff);
        var fileSubPath = filePath.substring(firstDiff);
        
        var prepend = '';
        if(workingSubPath.length === 0) {
            prepend += './';
        }
        
        while(workingSubPath.length > 0) {
            var slashIdx = workingSubPath.lastIndexOf('/');
            if(slashIdx < 0) {
                break;
            }
            prepend += '../';
            workingSubPath = workingSubPath.substring(0, slashIdx);
        }
        
        prepend += fileSubPath;
        
        return prepend + filename;
    }
    
    function handleFile(f) {
        var name = getRelatedPath(f);
        var contains = name.indexOf(existingPath) >= 0;
        var startsWithDotSlash = name.startsWith('./') && existingPath.startsWith('./');
        if((contains && !startsWithDotSlash) || startsWithDotSlash) {
            var insertText = (name.startsWith(existingPath) ? name.substring(existingPath.length) : name) ;
            localModules.push({
                label: name,
                kind: languageServer.CompletionItemKind.Module,
                data: name,
                detail: name,
                insertText: insertText,
                sortText: path.basename(f)
            });
        }
    }
    
    function recursiveReadDir(pth) {
        var list = listJsFilesAndDirectories(pth);
    
        _.forEach(list.files, (f) => {
            handleFile(f);
        });
        
        _.forEach(list.dirs, (dir) => {
            recursiveReadDir(dir); 
        });
    }
}

connection.onCompletion((textDocumentPosition) => {
    var file = textDocumentPosition.uri.replace('%3A', ':').replace('file:///', '');
    
    var isWin = /^win/.test(process.platform);
    
    if(isWin) {
      file[0] = file[0].toUpperCase();
    }
    else {
      file = '/' + file;
    }
    
    

    var document = documents.get(textDocumentPosition.uri);
    var offset = document.offsetAt(textDocumentPosition.position);

    var text = document.getText();
    var pretext = 'require("';
    if (offset - pretext.length < 0) {
        return [];
    }
    
    var requireOffset = text.lastIndexOf(pretext, offset);
    var requireOffset2 = text.lastIndexOf(pretext.replace('"', "'"), offset);
    requireOffset = Math.max(requireOffset, requireOffset2);
    if(requireOffset < 0)
        return;
    
    
    var realOffset = text.lastIndexOf("'", offset-1);
    var realOffset2 = text.lastIndexOf('"', offset-1);
    realOffset = Math.max(realOffset, realOffset2);
    if(realOffset < 0 || realOffset !== requireOffset + 8)
        return [];

    if(text[offset] !== '"' && text[offset] !== "'")
        return [];
    if(document.positionAt(requireOffset).line !== textDocumentPosition.position.line)
        return [];
    
    var existingText = text.substring(realOffset+1, offset);
    
    var result = [];
    _.forEach(builtIns, (b) => {
        if(!existingText.startsWith('.'))
            result.push(_.pick(b, ['label', 'kind', 'data']));
    });
    
    generateFromNodeModules(file, existingText);
    
    _.forEach(nodeModules, (m) => {
        result.push(_.pick(m, ['label', 'kind', 'data']));
    });
    
    generateFromLocal(file, existingText, realOffset+1, document);
    
    _.forEach(localModules, (m) => {
        result.push(_.pick(m, ['label', 'kind', 'data', 'sortText']));
    });

    return result;
});

connection.onCompletionResolve((item) => {
    var val = _.find(builtIns, (b) => b.data == item.data) || _.find(nodeModules, (b) => b.data == item.data) || _.find(localModules, (b) => b.data == item.data);
    if(val) {
        item.detail = val.detail;
        item.documentation = val.documentation;
        item.insertText = val.insertText;
        item.sortText = val.sortText;
    }
    return item;
});

connection.listen();

