/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the Source EULA. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';

import { UiProviderPanel } from './uiProviderPanel';

export async function activate(extension: vscode.ExtensionContext) {
	extension.subscriptions.push(vscode.commands.registerCommand('reactTest.launch', async () => await UiProviderPanel.render(extension)));
}
