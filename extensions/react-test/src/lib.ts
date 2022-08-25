/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the Source EULA. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';

export function getNonce() {
	let text = '';
	const possible =
		'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	for (let i = 0; i < 32; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
}

interface GetSessionParams {
	createIfNone: boolean
}

const GITHUB_AUTH_PROVIDER_ID = 'github';
const SCOPES = ['user:email', 'repo'];

export function getSession(params: GetSessionParams) {
	const { createIfNone } = params;
	return vscode.authentication.getSession(GITHUB_AUTH_PROVIDER_ID, SCOPES, {
		createIfNone,
	});
}
