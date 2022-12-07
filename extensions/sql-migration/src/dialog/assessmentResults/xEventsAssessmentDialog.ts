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

export enum XEventsAssessmentOptions {
	CollectData,
	OpenExisting
}

export class XEventsAssessmentDialog {
	private dialog: azdata.window.Dialog | undefined;
	private _isOpen: boolean = false;
	private _disposables: vscode.Disposable[] = [];

	private _xEventsCollectionMode: XEventsAssessmentOptions = XEventsAssessmentOptions.OpenExisting;

	private _collectDataContainer!: azdata.FlexContainer;
	private _instructionsContainer!: azdata.FlexContainer;
	private _collectDataFolderInput!: azdata.InputBoxComponent;

	private _openExistingContainer!: azdata.FlexContainer;
	private _openExistingFolderInput!: azdata.InputBoxComponent;

	private _folderPickerInputBox!: azdata.InputBoxComponent;

	private _createEventSessionScript: string =
		`CREATE EVENT SESSION [ratruongxevents126] ON SERVER
ADD EVENT sqlserver.sql_statement_completed(
ACTION (sqlserver.sql_text,sqlserver.client_app_name,sqlserver.client_hostname,sqlserver.database_id))
ADD TARGET package0.asynchronous_file_target(SET filename=N' \\\\AALAB03-2K8\\SharedBackup\\ratruong\\xevents\\ratruongxevents126.xel')
WITH (MAX_MEMORY=2048 KB,EVENT_RETENTION_MODE=ALLOW_SINGLE_EVENT_LOSS,MAX_DISPATCH_LATENCY=3 SECONDS,MAX_EVENT_SIZE=0 KB,MEMORY_PARTITION_MODE=NONE,TRACK_CAUSALITY=OFF,STARTUP_STATE=OFF)`;

	private _startEventSessionScript: string =
		`ALTER EVENT SESSION [ratruongxevents126]
ON SERVER
STATE = START;`;

	private _stopEventSessionScript: string =
		`ALTER EVENT SESSION [ratruongxevents126]
ON SERVER
STATE = STOP;`;

	private _xEventsFilesFolderPath!: string;

	constructor(
		public migrationStateModel: MigrationStateModel) {
	}

	private async initializeDialog(dialog: azdata.window.Dialog): Promise<void> {
		return new Promise<void>((resolve, reject) => {
			dialog.registerContent(async (view) => {
				try {
					const flex = await this.createContainer(view);

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

	private async createContainer(_view: azdata.ModelView): Promise<azdata.FlexContainer> {
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

		// const instructions = _view.modelBuilder.text()
		// 	.withProps({
		// 		value: constants.XEVENTS_ASSESSMENT_INSTRUCTIONS,
		// 		CSSStyles: { ...styles.LABEL_CSS, 'margin-bottom': '8px' }
		// 	}).component();

		// const selectFolderContainer = _view.modelBuilder.flexContainer()
		// 	.withProps(
		// 		{ CSSStyles: { 'flex-direction': 'row', 'align-items': 'center' } })
		// 	.component();

		// this._folderPickerInputBox = _view.modelBuilder.inputBox().withProps({
		// 	placeHolder: constants.FOLDER_NAME,
		// 	readOnly: true,
		// 	width: 320,
		// 	CSSStyles: { 'margin-right': '12px' },
		// }).component();

		// this._disposables.push(
		// 	this._folderPickerInputBox.onTextChanged(async (value) => {
		// 		if (value) {
		// 			this._xEventsFilesFolderPath = value.trim();
		// 			this.dialog!.okButton.enabled = true;
		// 		}
		// 	}));

		// const openButton = _view.modelBuilder.button()
		// 	.withProps({
		// 		label: constants.OPEN,
		// 		width: 100,
		// 		CSSStyles: { 'margin': '0' }
		// 	}).component();

		// this._disposables.push(
		// 	openButton.onDidClick(
		// 		async (e) => this._folderPickerInputBox.value = await utils.promptUserForFolder()));

		// selectFolderContainer.addItems([
		// 	this._folderPickerInputBox,
		// 	openButton]);

		const selectDataSourceRadioButtons = await this.createDataSourceContainer(_view);

		container.addItems([
			description,
			// instructions,
			// selectFolderContainer
			selectDataSourceRadioButtons
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




	private async createDataSourceContainer(_view: azdata.ModelView): Promise<azdata.FlexContainer> {
		const chooseMethodText = _view.modelBuilder.text().withProps({
			value: 'Choose how you want to provide extended events traces',
			CSSStyles: {
				...styles.LABEL_CSS,
				'margin-top': '16px',
			}
		}).component();

		const buttonGroup = 'dataSourceContainer';
		const radioButtonContainer = _view.modelBuilder.flexContainer().withProps({
			ariaLabel: 'Choose how you want to provide extended events traces',
			ariaRole: 'radiogroup',
			CSSStyles: {
				'flex-direction': 'row',
				'width': 'fit-content',
				'margin': '4px 0 16px',
			}
		}).component();

		const collectDataButton = _view.modelBuilder.radioButton()
			.withProps({
				name: buttonGroup,
				label: 'Collect extended events traces now',
				checked: this._xEventsCollectionMode === XEventsAssessmentOptions.CollectData,
				CSSStyles: {
					...styles.BODY_CSS,
					'margin': '0'
				},
			}).component();
		this._disposables.push(
			collectDataButton.onDidChangeCheckedState(async checked => {
				if (checked) {
					await this.switchDataSourceContainerFields(
						XEventsAssessmentOptions.CollectData);
				}
			}));

		const openExistingButton = _view.modelBuilder.radioButton()
			.withProps({
				name: buttonGroup,
				label: 'I already have the extended events traces',
				checked: this._xEventsCollectionMode === XEventsAssessmentOptions.OpenExisting,
				CSSStyles: { ...styles.BODY_CSS, 'margin': '0 12px' }
			}).component();
		this._disposables.push(
			openExistingButton.onDidChangeCheckedState(async checked => {
				if (checked) {
					await this.switchDataSourceContainerFields(
						XEventsAssessmentOptions.OpenExisting);
				}
			}));

		radioButtonContainer.addItems([
			collectDataButton,
			openExistingButton]);

		this._collectDataContainer = await this.createCollectDataContainer(_view);
		this._openExistingContainer = this.createOpenExistingContainer(_view);

		const container = _view.modelBuilder.flexContainer()
			.withLayout({ flexFlow: 'column' })
			.withItems([
				chooseMethodText,
				radioButtonContainer,
				this._openExistingContainer,
				this._collectDataContainer])
			.component();

		return container;
	}

	private async createCollectDataContainer(_view: azdata.ModelView): Promise<azdata.FlexContainer> {
		const container = _view.modelBuilder.flexContainer()
			.withProps(
				{ CSSStyles: { 'flex-direction': 'column', 'display': 'inline' } })
			.component();

		const instructions = _view.modelBuilder.text()
			.withProps({
				value: 'Select a folder where extended events traces will be saved',
				CSSStyles: { ...styles.LABEL_CSS, 'margin-bottom': '8px' }
			}).component();

		const selectFolderContainer = _view.modelBuilder.flexContainer()
			.withProps(
				{ CSSStyles: { 'flex-direction': 'row', 'align-items': 'center' } })
			.component();

		this._collectDataFolderInput = _view.modelBuilder.inputBox()
			.withProps({
				placeHolder: constants.FOLDER_NAME,
				readOnly: true,
				width: 320,
				CSSStyles: { 'margin-right': '12px' },
			}).component();
		this._disposables.push(
			this._collectDataFolderInput.onTextChanged(async (value) => {
				if (value) {
					this._xEventsFilesFolderPath = value.trim();
					this.dialog!.okButton.enabled = true;

					////// show/hide instructions
					await utils.updateControlDisplay(this._instructionsContainer, true);
				} else {
					await utils.updateControlDisplay(this._instructionsContainer, false);
				}
			}));

		const browseButton = _view.modelBuilder.button()
			.withProps({
				label: constants.BROWSE,
				width: 100,
				CSSStyles: { 'margin': '0' }
			}).component();
		this._disposables.push(browseButton.onDidClick(async (e) => {
			let folder = await utils.promptUserForFolder();
			this._collectDataFolderInput.value = folder;
		}));

		selectFolderContainer.addItems([
			this._collectDataFolderInput,
			browseButton]);


		this._instructionsContainer = this.createInstructionsContainer(_view);
		await utils.updateControlDisplay(this._instructionsContainer, false);


		container.addItems([
			instructions,
			selectFolderContainer,
			this._instructionsContainer]);
		return container;
	}

	private createInstructionsContainer(_view: azdata.ModelView): azdata.FlexContainer {
		// instructions

		const instructionsContainer = _view.modelBuilder.flexContainer()
			.withProps(
				{ CSSStyles: { 'flex-direction': 'column', 'display': 'inline' } })
			.component();

		const description = _view.modelBuilder.text()
			.withProps({
				value: 'You can collect extended events traces by starting a new event session on your source instance with the following script:',
				CSSStyles: { ...styles.BODY_CSS, 'margin-top': '16px' }
			})
			.component();

		const startSessionTextBox = _view.modelBuilder.text()
			.withProps({
				value: this._createEventSessionScript,
				CSSStyles: {
					'font': '14px "Monaco", "Menlo", "Consolas", "Droid Sans Mono", "Inconsolata", "Courier New", monospace',
					'margin': '0',
					'white-space': 'pre',
					'background-color': '#eeeeee',
				}
			}).component();

		const description2 = _view.modelBuilder.text()
			.withProps({
				value: 'Then, you can start the event session with the following script:',
				CSSStyles: { ...styles.BODY_CSS, 'margin-top': '16px' }
			})
			.component();

		const startSessionTextBox2 = _view.modelBuilder.text()
			.withProps({
				value: this._startEventSessionScript,
				CSSStyles: {
					'font': '14px "Monaco", "Menlo", "Consolas", "Droid Sans Mono", "Inconsolata", "Courier New", monospace',
					'margin': '0',
					'white-space': 'pre',
					'background-color': '#eeeeee',
				}
			}).component();

		const description3 = _view.modelBuilder.text()
			.withProps({
				value: 'After the event session has started, you can execute ad-hoc queries against your source, which will be captured. Once the queries have been captured, you can end the event session with the following script:',
				CSSStyles: { ...styles.BODY_CSS, 'margin-top': '16px' }
			})
			.component();

		const startSessionTextBox3 = _view.modelBuilder.text()
			.withProps({
				value: this._stopEventSessionScript,
				CSSStyles: {
					'font': '14px "Monaco", "Menlo", "Consolas", "Droid Sans Mono", "Inconsolata", "Courier New", monospace',
					'margin': '0',
					'white-space': 'pre',
					'background-color': '#eeeeee',
				}
			}).component();

		instructionsContainer.addItems([
			description,
			startSessionTextBox,
			description2,
			startSessionTextBox2,
			description3,
			startSessionTextBox3]);
		// end instructions

		return instructionsContainer;
	}

	private createOpenExistingContainer(_view: azdata.ModelView): azdata.FlexContainer {
		const container = _view.modelBuilder.flexContainer()
			.withProps(
				{ CSSStyles: { 'flex-direction': 'column', 'display': 'none', } })
			.component();

		const instructions = _view.modelBuilder.text()
			.withProps({
				value: 'Select a folder on your local drive where previously collected extended events traces were saved',
				CSSStyles: { ...styles.LABEL_CSS, 'margin-bottom': '8px' }
			}).component();

		const selectFolderContainer = _view.modelBuilder.flexContainer()
			.withProps(
				{ CSSStyles: { 'flex-direction': 'row', 'align-items': 'center' } })
			.component();

		this._openExistingFolderInput = _view.modelBuilder.inputBox().withProps({
			placeHolder: constants.FOLDER_NAME,
			readOnly: true,
			width: 320,
			CSSStyles: { 'margin-right': '12px' },
		}).component();
		this._disposables.push(
			this._openExistingFolderInput.onTextChanged(async (value) => {
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
				async (e) => this._openExistingFolderInput.value = await utils.promptUserForFolder()));

		selectFolderContainer.addItems([
			this._openExistingFolderInput,
			openButton]);
		container.addItems([
			instructions,
			selectFolderContainer]);
		return container;
	}

	private async switchDataSourceContainerFields(containerType: XEventsAssessmentOptions): Promise<void> {
		this._xEventsCollectionMode = containerType;

		let okButtonEnabled = false;
		switch (containerType) {
			case XEventsAssessmentOptions.CollectData:
				await utils.updateControlDisplay(this._collectDataContainer, true);
				await utils.updateControlDisplay(this._openExistingContainer, false);

				if (this._collectDataFolderInput.value) {
					okButtonEnabled = true;
				}
				break;
			case XEventsAssessmentOptions.OpenExisting:
				await utils.updateControlDisplay(this._collectDataContainer, false);
				await utils.updateControlDisplay(this._openExistingContainer, true);

				if (this._openExistingFolderInput.value) {
					okButtonEnabled = true;
				}
				break;
		}
		this.dialog!.okButton.enabled = okButtonEnabled;
	}
}
