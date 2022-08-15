/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the Source EULA. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/


// Get access to the VS Code API from within the webview context
const vscode = acquireVsCodeApi();

window.addEventListener('load', main);

function main() {
	console.log('setting up main');
	setVSCodeMessageListener();

	let selectButton = document.getElementById('select-source');
	console.log('source: ' + selectButton);
	selectButton.addEventListener('click', () => selectConnection('source'));

	selectButton = document.getElementById('select-target');
	selectButton.addEventListener('click', () => selectConnection('target'));
}

function selectConnection(id) {
	console.log('selecting connection: ' + id);
	vscode.postMessage({
		command: 'selectConnection',
		payload: id
	});
}

function setVSCodeMessageListener() {
	console.log('setting up webview listener');

	window.addEventListener('message', (event) => {
		console.log('message received:');
		console.log(event.data);

		const command = event.data.command;
		const data = JSON.parse(event.data.payload);

		console.log(command);
		console.log(data);
	});
}
