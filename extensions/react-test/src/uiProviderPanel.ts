/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the Source EULA. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';
import { getNonce } from './utils';

export class UiProviderPanel {
	public static providerPanel: UiProviderPanel | undefined;
	private disposables: vscode.Disposable[] = [];

	public static viewType = 'reactTest.ui';

	public static async render(extension: vscode.ExtensionContext) {
		if (UiProviderPanel.providerPanel) {
			// if the webview panel already exists, reveal it
			UiProviderPanel.providerPanel.panel.reveal(vscode.ViewColumn.One);
		} else {
			const panel = vscode.window.createWebviewPanel(
				this.viewType,
				'React Test Panel',
				vscode.ViewColumn.One,
				{
					enableScripts: true
				}
			);

			UiProviderPanel.providerPanel = new UiProviderPanel(panel, extension);

			try {
				const webview = UiProviderPanel.providerPanel.panel.webview;
				webview.html = await UiProviderPanel.providerPanel.getHtmlForWebview(webview);
			} catch (e) {
				console.log(e);
			}
		}
	}

	private async getHtmlForWebview(webview: vscode.Webview): Promise<string> {
		const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this.extension.extensionUri, 'out/webviews/index.js'));
		const styleVSCodeUri = webview.asWebviewUri(vscode.Uri.joinPath(this.extension.extensionUri, 'out/webviews/index.css'));
		const codiconsUri = webview.asWebviewUri(vscode.Uri.joinPath(this.extension.extensionUri, 'out/webviews/public/codicon.css'));

		// Use a nonce to whitelist which scripts can be run
		const nonce = getNonce();

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
				<title>Data Tier Application Wizard</title>
			</head>
			<body>
				<div id="root"></div>
				<script nonce="${nonce}" src="${scriptUri}"></script>
			</body>
			</html>`;
	}

	private constructor(protected panel: vscode.WebviewPanel, private readonly extension: vscode.ExtensionContext) {
		this.panel.onDidDispose(this.dispose, null, this.disposables);
		this.setupWebviewMessageListener();
	}

	private setupWebviewMessageListener() {
		this.panel.webview.onDidReceiveMessage(async (message) => {
			const command = message.command;
			const data = message.data;

			console.log(`Received '${command}': ${data}`);
		});
	}

	public dispose() {
		UiProviderPanel.providerPanel = undefined;
		this.panel.dispose();

		while (this.disposables.length > 0) {
			const disposable = this.disposables.pop();

			if (disposable) {
				disposable.dispose();
			}
		}
	}
}
