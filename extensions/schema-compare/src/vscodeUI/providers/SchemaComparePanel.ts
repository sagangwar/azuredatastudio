/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the Source EULA. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';
import { getNonce, getUri } from '../../webviews/utils';
import * as constants from '../../localizedConstants';

export class SchemaComparePanel {
	public static currentPanel: SchemaComparePanel | undefined;
	private disposables: vscode.Disposable[] = [];

	public static readonly viewType = 'schemaCompare.schemaCompareWebUi';

	private constructor(protected panel: vscode.WebviewPanel, private readonly extensionUri: vscode.Uri) {
		this.panel.onDidDispose(this.dispose, null, this.disposables);

		this.setupWebviewMessageListener();
	}

	public static async render(extensionUri: vscode.Uri): Promise<void> {
		if (SchemaComparePanel.currentPanel) {
			// If the webview panel already exists reveal it
			SchemaComparePanel.currentPanel.panel.reveal(vscode.ViewColumn.One);
		} else {
			// If a webview panel does not already exist create and show a new one
			const panel = vscode.window.createWebviewPanel(
				this.viewType,
				constants.SchemaCompareLabel,
				vscode.ViewColumn.One,
				{
					enableScripts: true
				}
			);

			SchemaComparePanel.currentPanel = new SchemaComparePanel(panel, extensionUri);

			await SchemaComparePanel.currentPanel.resolveWebview(SchemaComparePanel.currentPanel.panel.webview);
		}
	}

	private async resolveWebview(webview: vscode.Webview): Promise<void> {
		try {
			webview.html = await this.getHtmlForWebview(webview);
		} catch (e) {
			console.log(e);
		}
	}
	private async getHtmlForWebview(webview: vscode.Webview): Promise<string> {
		const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, 'out/webviews/index.js'));
		const styleVSCodeUri = webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, 'out/webviews/index.css'));
		const codiconsUri = webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, 'out/webviews/public/codicon.css'));

		// Use a nonce to whitelist which scripts can be run
		const nonce = getNonce();

		const dirName = 'test dir name';
		const gitRepo = 'benjin git repo';

		return /* html */ `
			<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">

				<!--
				Use a content security policy to only allow loading images from https or from our extension directory,
				and only allow scripts that have a specific nonce.
				-->
				<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${webview.cspSource} 'self' data:; style-src ${webview.cspSource}; script-src 'nonce-${nonce}'; font-src ${webview.cspSource};">

				<meta name="viewport" content="width=device-width, initial-scale=1.0">


				<link href="${styleVSCodeUri}" rel="stylesheet" />
				<link href="${codiconsUri}" rel="stylesheet" />
				<script nonce="${nonce}">
					window.acquireVsCodeApi = acquireVsCodeApi;
				</script>

				<title>Schema Compare</title>
			</head>
			<body>
				<h1>Hello Test</h1>
				<div data-workspace="${dirName}" data-gitrepo="${gitRepo}" id="root"></div>
				<script nonce="${nonce}" src="${scriptUri}"></script>
			</body>
			</html>`;
	}


	private setupWebviewMessageListener() {
		console.log('received message');

		this.panel.webview.onDidReceiveMessage(async (message) => {
			const command = message.command;
			const payload = message.payload;

			switch (command) {
				case 'selectConnection':
					const connection = await vscode.window.showInputBox({ title: `enter ${payload} connection` });

					this.panel.webview.postMessage({
						command: 'setConnection',
						payload: {
							connection
						}
					});

					break;
			}
		});
	}

	public dispose() {
		SchemaComparePanel.currentPanel = undefined;

		// Dispose of the current webview panel
		this.panel.dispose();

		// Dispose of all disposables (i.e. commands) for the current webview panel
		while (this.disposables.length) {
			const disposable = this.disposables.pop();
			if (disposable) {
				disposable.dispose();
			}
		}
	}
}
