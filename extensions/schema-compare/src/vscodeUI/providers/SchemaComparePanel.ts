/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the Source EULA. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';
import { getUri } from '../utils';
import * as constants from '../../localizedConstants';

export class SchemaComparePanel {
	public static currentPanel: SchemaComparePanel | undefined;
	private disposables: vscode.Disposable[] = [];

	public static readonly viewType = 'schemaCompare.schemaCompareWebUi';

	private constructor(private panel: vscode.WebviewPanel, private readonly extensionUri: vscode.Uri) {
		this.panel.onDidDispose(this.dispose, null, this.disposables);
		this.panel.webview.html = this.getWebviewContent(this.panel.webview, extensionUri);

		this.setupWebviewMessageListener();
	}

	public static render(extensionUri: vscode.Uri) {
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
		}
	}

	private getWebviewContent(webview: vscode.Webview, extensionUri: vscode.Uri) {
		const toolkitUri = getUri(webview, extensionUri, ['node_modules', '@vscode', 'webview-ui-toolkit', 'dist', 'toolkit.js',]);
		const mainUri = getUri(webview, extensionUri, ['src', 'vscodeUI', 'ui', 'main.js']);
		const stylesUri = getUri(webview, extensionUri, ['src', 'vscodeUI', 'ui', 'styles.css']);

		return /*html*/ `
				<!DOCTYPE html>
				<html lang='en'>
					<head>
						<meta charset='UTF-8'>
						<meta name='viewport' content='width=device-width, initial-scale=1.0'>
						<script type='module' src='${toolkitUri}'></script>
						<script type='module' src='${mainUri}'></script>
						<link rel='stylesheet' href='${stylesUri}'>
						<title>Schema Compare</title>
					</head>
					<body>
						<h1>Schema Compare</h1>
						<section id='Connection Selection'>
						<vscode-text-field size="50">Source:</vscode-text-field>
						<vscode-button id="select-source" appearance='secondary'>Select</vscode-button>

						<vscode-button id='swap-source-target' appearance="secondary">Swap</vscode-button>

						<vscode-text-field size="50">Target:</vscode-text-field>
						<vscode-button id='select-target' appearance='secondary'>Select</vscode-button>
						</section>

						<vscode-button id='run-compare'>Check</vscode-button>
					</body>
				</html>
			`;
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
