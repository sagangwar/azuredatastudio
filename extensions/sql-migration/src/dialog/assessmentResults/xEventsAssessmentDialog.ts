/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the Source EULA. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as azdata from 'azdata';
import * as vscode from 'vscode';
import { MigrationStateModel } from '../../models/stateMachine';
import * as constants from '../../constants/strings';
import * as styles from '../../constants/styles';
import * as utils from '../../api/utils';

export class XEventsAssessmentDialog {
	private dialog: azdata.window.Dialog | undefined;
	private _isOpen: boolean = false;
	private _disposables: vscode.Disposable[] = [];

	private _folderPickerInputBox!: azdata.InputBoxComponent;
	private _xEventsFilesFolderPath!: string;

	constructor(
		public migrationStateModel: MigrationStateModel) {
	}

	private async initializeDialog(dialog: azdata.window.Dialog): Promise<void> {
		return new Promise<void>((resolve, reject) => {
			dialog.registerContent(async (view) => {
				try {
					const flex = this.createContainer(view);

					this._disposables.push(
						view.onClosed(e =>
							this._disposables.forEach(
								d => { try { d.dispose(); } catch { } })));

					await view.initializeModel(flex);
					resolve();
				} catch (ex) {
					reject(ex);
				}
			});
		});
	}

	private createContainer(_view: azdata.ModelView): azdata.FlexContainer {
		const container = _view.modelBuilder.flexContainer()
			.withProps(
				{ CSSStyles: { 'margin': '8px 16px', 'flex-direction': 'column' } })
			.component();

		const description = _view.modelBuilder.text()
			.withProps({
				value: constants.XEVENTS_ASSESSMENT_DESCRIPTION,
				CSSStyles: { ...styles.BODY_CSS }
			})
			.component();

		const instructions = _view.modelBuilder.text()
			.withProps({
				value: constants.XEVENTS_ASSESSMENT_INSTRUCTIONS,
				CSSStyles: { ...styles.LABEL_CSS, 'margin-bottom': '8px' }
			}).component();

		const selectFolderContainer = _view.modelBuilder.flexContainer()
			.withProps(
				{ CSSStyles: { 'flex-direction': 'row', 'align-items': 'center' } })
			.component();

		this._folderPickerInputBox = _view.modelBuilder.inputBox().withProps({
			placeHolder: constants.FOLDER_NAME,
			readOnly: true,
			width: 320,
			CSSStyles: { 'margin-right': '12px' },
		}).component();

		this._disposables.push(
			this._folderPickerInputBox.onTextChanged(async (value) => {
				if (value) {
					this._xEventsFilesFolderPath = value.trim();
					this.dialog!.okButton.enabled = true;
				}
			}));

		const openButton = _view.modelBuilder.button()
			.withProps({
				label: constants.OPEN,
				width: 100,
				CSSStyles: { 'margin': '0' }
			}).component();

		this._disposables.push(
			openButton.onDidClick(
				async (e) => this._folderPickerInputBox.value = await utils.promptUserForFolder()));

		selectFolderContainer.addItems([
			this._folderPickerInputBox,
			openButton]);

		container.addItems([
			description,
			instructions,
			selectFolderContainer
		]);

		return container;
	}

	public async openDialog() {
		if (!this._isOpen) {
			this._isOpen = true;
			this.dialog = azdata.window.createModelViewDialog(
				constants.XEVENTS_ASSESSMENT_TITLE,
				'XEventsAssessmentDialog',
				'narrow');

			this.dialog.okButton.label = constants.XEVENTS_ASSESSMENT_TITLE;
			this._disposables.push(
				this.dialog.okButton.onClick(
					async () => await this.execute()));

			this._disposables.push(
				this.dialog.cancelButton.onClick(
					() => this._isOpen = false));

			const dialogSetupPromises: Thenable<void>[] = [];
			dialogSetupPromises.push(this.initializeDialog(this.dialog));
			azdata.window.openDialog(this.dialog);
			await Promise.all(dialogSetupPromises);

			if (this.migrationStateModel._xEventsFilesFolderPath) {
				this._folderPickerInputBox.value = this.migrationStateModel._xEventsFilesFolderPath;
			}
		}
	}

	protected async execute() {
		this._isOpen = false;
		this.migrationStateModel._xEventsFilesFolderPath = this._xEventsFilesFolderPath;
	}

	public get isOpen(): boolean {
		return this._isOpen;
	}
}
