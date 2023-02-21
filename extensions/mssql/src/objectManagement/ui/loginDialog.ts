/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the Source EULA. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import * as azdata from 'azdata';
import * as vscode from 'vscode';
import { DefaultInputWidth, ObjectManagementDialogBase } from './objectManagementDialogBase';
import { IObjectManagementService, ObjectManagement } from 'mssql';
import * as localizedConstants from '../localizedConstants';
import { AlterLoginDocUrl, AuthenticationType, CreateLoginDocUrl, NodeType, PublicServerRoleName } from '../constants';
import { getAuthenticationTypeByDisplayName, getAuthenticationTypeDisplayName, isValidSQLPassword } from '../utils';

export class LoginDialog extends ObjectManagementDialogBase<ObjectManagement.Login, ObjectManagement.LoginViewInfo> {
	private formContainer: azdata.DivContainer;
	private generalSection: azdata.GroupContainer;
	private sqlAuthSection: azdata.GroupContainer;
	private serverRoleSection: azdata.GroupContainer;
	private advancedSection: azdata.GroupContainer;
	private nameInput: azdata.InputBoxComponent;
	private authTypeDropdown: azdata.DropDownComponent;
	private passwordInput: azdata.InputBoxComponent;
	private confirmPasswordInput: azdata.InputBoxComponent;
	private specifyOldPasswordCheckbox: azdata.CheckBoxComponent;
	private oldPasswordInput: azdata.InputBoxComponent;
	private enforcePasswordPolicyCheckbox: azdata.CheckBoxComponent;
	private enforcePasswordExpirationCheckbox: azdata.CheckBoxComponent;
	private mustChangePasswordCheckbox: azdata.CheckBoxComponent;
	private defaultDatabaseDropdown: azdata.DropDownComponent;
	private defaultLanguageDropdown: azdata.DropDownComponent;
	private serverRoleTable: azdata.TableComponent;
	private connectPermissionCheckbox: azdata.CheckBoxComponent;
	private enabledCheckbox: azdata.CheckBoxComponent;
	private lockedOutCheckbox: azdata.CheckBoxComponent;

	constructor(objectManagementService: IObjectManagementService, connectionUri: string, isNewObject: boolean, name?: string, objectExplorerContext?: azdata.ObjectExplorerContext) {
		super(NodeType.Login, isNewObject ? CreateLoginDocUrl : AlterLoginDocUrl, objectManagementService, connectionUri, isNewObject, name, objectExplorerContext);
	}

	protected override async onConfirmation(): Promise<boolean> {
		// Empty password is only allowed when advanced password options are supported and the password policy check is off.
		// To match the SSMS behavior, a warning is shown to the user.
		if (this.viewInfo.supportAdvancedPasswordOptions
			&& this.objectInfo.authenticationType === AuthenticationType.Sql
			&& !this.objectInfo.password
			&& !this.objectInfo.enforcePasswordPolicy) {
			const result = await vscode.window.showWarningMessage(localizedConstants.BlankPasswordConfirmationText, { modal: true }, localizedConstants.YesText);
			return result === localizedConstants.YesText;
		}
		return true;
	}

	protected async validateInput(): Promise<string[]> {
		const errors: string[] = [];
		if (!this.objectInfo.name) {
			errors.push(localizedConstants.NameCannotBeEmptyError);
		}
		if (this.objectInfo.authenticationType === AuthenticationType.Sql) {
			if (!this.objectInfo.password && !(this.viewInfo.supportAdvancedPasswordOptions && !this.objectInfo.enforcePasswordPolicy)) {
				errors.push(localizedConstants.PasswordCannotBeEmptyError);
			}

			if (this.objectInfo.password && (this.objectInfo.enforcePasswordPolicy || !this.viewInfo.supportAdvancedPasswordOptions)
				&& !isValidSQLPassword(this.objectInfo.password, this.objectInfo.name)
				&& (this.isNewObject || this.objectInfo.password !== this.originalObjectInfo.password)) {
				errors.push(localizedConstants.InvalidPasswordError);
			}

			if (this.objectInfo.password !== this.confirmPasswordInput.value) {
				errors.push(localizedConstants.PasswordsNotMatchError);
			}

			if (this.specifyOldPasswordCheckbox?.checked && !this.objectInfo.oldPassword) {
				errors.push(localizedConstants.OldPasswordCannotBeEmptyError);
			}
		}
		return errors;
	}

	protected async onComplete(): Promise<void> {
		if (this.isNewObject) {
			await this.objectManagementService.createLogin(this.contextId, this.objectInfo);
		} else {
			await this.objectManagementService.updateLogin(this.contextId, this.objectInfo);
		}
	}

	protected async onDispose(): Promise<void> {
		await this.objectManagementService.disposeLoginView(this.contextId);
	}

	protected async initializeData(): Promise<ObjectManagement.LoginViewInfo> {
		const viewInfo = await this.objectManagementService.initializeLoginView(this.connectionUri, this.contextId, this.isNewObject, this.objectName);
		viewInfo.objectInfo.password = viewInfo.objectInfo.password ?? '';
		return viewInfo;
	}

	protected async initializeUI(): Promise<void> {
		this.dialogObject.registerContent(async view => {
			const sections: azdata.Component[] = [];
			this.initializeGeneralSection(view);
			sections.push(this.generalSection);

			if (this.isNewObject || this.objectInfo.authenticationType === 'Sql') {
				this.initializeSqlAuthSection(view);
				sections.push(this.sqlAuthSection);
			}

			this.initializeServerRolesSection(view);
			sections.push(this.serverRoleSection);

			if (this.viewInfo.supportAdvancedOptions) {
				this.initializeAdvancedSection(view);
				sections.push(this.advancedSection);
			}

			this.formContainer = this.createFormContainer(view, sections);
			return view.initializeModel(this.formContainer)
		});
	}

	private initializeGeneralSection(view: azdata.ModelView): void {
		this.nameInput = view.modelBuilder.inputBox().withProps({
			ariaLabel: localizedConstants.NameText,
			enabled: this.isNewObject,
			value: this.objectInfo.name,
			width: DefaultInputWidth
		}).component();
		this.nameInput.onTextChanged(async () => {
			this.objectInfo.name = this.nameInput.value;
			this.onObjectValueChange();
			await this.runValidation(false);
		});

		const nameContainer = this.createLabelInputContainer(view, localizedConstants.NameText, this.nameInput);
		const authTypes = [];
		if (this.viewInfo.supportWindowsAuthentication) {
			authTypes.push(localizedConstants.WindowsAuthenticationTypeDisplayText);
		}
		if (this.viewInfo.supportSQLAuthentication) {
			authTypes.push(localizedConstants.SQLAuthenticationTypeDisplayText);
		}
		if (this.viewInfo.supportAADAuthentication) {
			authTypes.push(localizedConstants.AADAuthenticationTypeDisplayText);
		}
		this.authTypeDropdown = view.modelBuilder.dropDown().withProps({
			ariaLabel: localizedConstants.AuthTypeText,
			values: authTypes,
			value: getAuthenticationTypeDisplayName(this.objectInfo.authenticationType),
			width: DefaultInputWidth,
			enabled: this.isNewObject
		}).component();
		this.authTypeDropdown.onValueChanged(async () => {
			this.objectInfo.authenticationType = getAuthenticationTypeByDisplayName(<string>this.authTypeDropdown.value);
			this.setViewByAuthenticationType();
			this.onObjectValueChange();
			await this.runValidation(false);
		});
		const authTypeContainer = this.createLabelInputContainer(view, localizedConstants.AuthTypeText, this.authTypeDropdown);

		this.enabledCheckbox = this.createCheckbox(view, localizedConstants.EnabledText, this.objectInfo.isEnabled);
		this.enabledCheckbox.onChanged(() => {
			this.objectInfo.isEnabled = this.enabledCheckbox.checked;
			this.onObjectValueChange();
		});
		this.generalSection = this.createGroup(view, localizedConstants.GeneralSectionHeader, [nameContainer, authTypeContainer, this.enabledCheckbox], false);
	}

	private initializeSqlAuthSection(view: azdata.ModelView): void {
		const items: azdata.Component[] = [];
		this.passwordInput = this.createPasswordInputBox(view, localizedConstants.PasswordText, this.objectInfo.password ?? '');
		const passwordRow = this.createLabelInputContainer(view, localizedConstants.PasswordText, this.passwordInput);
		this.confirmPasswordInput = this.createPasswordInputBox(view, localizedConstants.ConfirmPasswordText, this.objectInfo.password ?? '');
		this.passwordInput.onTextChanged(async () => {
			this.objectInfo.password = this.passwordInput.value;
			this.onObjectValueChange();
			await this.runValidation(false);
		});
		this.confirmPasswordInput.onTextChanged(async () => {
			await this.runValidation(false);
		});
		const confirmPasswordRow = this.createLabelInputContainer(view, localizedConstants.ConfirmPasswordText, this.confirmPasswordInput);
		items.push(passwordRow, confirmPasswordRow);

		if (!this.isNewObject) {
			this.specifyOldPasswordCheckbox = this.createCheckbox(view, localizedConstants.SpecifyOldPasswordText);
			this.oldPasswordInput = this.createPasswordInputBox(view, localizedConstants.OldPasswordText, '', false);
			const oldPasswordRow = this.createLabelInputContainer(view, localizedConstants.OldPasswordText, this.oldPasswordInput);
			this.specifyOldPasswordCheckbox.onChanged(async () => {
				this.oldPasswordInput.enabled = this.specifyOldPasswordCheckbox.checked;
				this.objectInfo.oldPassword = '';
				if (!this.specifyOldPasswordCheckbox.checked) {
					this.oldPasswordInput.value = '';
				}
				this.onObjectValueChange();
				await this.runValidation(false);
			});
			this.oldPasswordInput.onTextChanged(async () => {
				this.objectInfo.oldPassword = this.oldPasswordInput.value;
				this.onObjectValueChange();
				await this.runValidation(false);
			});
			items.push(this.specifyOldPasswordCheckbox, oldPasswordRow);
		}

		if (this.viewInfo.supportAdvancedPasswordOptions) {
			this.enforcePasswordPolicyCheckbox = this.createCheckbox(view, localizedConstants.EnforcePasswordPolicyText, this.objectInfo.enforcePasswordPolicy);
			this.enforcePasswordExpirationCheckbox = this.createCheckbox(view, localizedConstants.EnforcePasswordExpirationText, this.objectInfo.enforcePasswordPolicy);
			this.mustChangePasswordCheckbox = this.createCheckbox(view, localizedConstants.MustChangePasswordText, this.objectInfo.mustChangePassword);
			this.enforcePasswordPolicyCheckbox.onChanged(async () => {
				const enforcePolicy = this.enforcePasswordPolicyCheckbox.checked;
				this.objectInfo.enforcePasswordPolicy = enforcePolicy;
				this.enforcePasswordExpirationCheckbox.enabled = enforcePolicy;
				this.mustChangePasswordCheckbox.enabled = enforcePolicy;
				this.enforcePasswordExpirationCheckbox.checked = enforcePolicy;
				this.mustChangePasswordCheckbox.checked = enforcePolicy;
				this.onObjectValueChange();
				await this.runValidation(false);
			});
			this.enforcePasswordExpirationCheckbox.onChanged(() => {
				const enforceExpiration = this.enforcePasswordExpirationCheckbox.checked;
				this.objectInfo.enforcePasswordExpiration = enforceExpiration;
				this.mustChangePasswordCheckbox.enabled = enforceExpiration;
				this.mustChangePasswordCheckbox.checked = enforceExpiration;
				this.onObjectValueChange();
			});
			this.mustChangePasswordCheckbox.onChanged(() => {
				this.objectInfo.mustChangePassword = this.mustChangePasswordCheckbox.checked;
				this.onObjectValueChange();
			});
			items.push(this.enforcePasswordPolicyCheckbox, this.enforcePasswordExpirationCheckbox, this.mustChangePasswordCheckbox);
			if (!this.isNewObject) {
				this.lockedOutCheckbox = this.createCheckbox(view, localizedConstants.LoginLockedOutText, this.objectInfo.isLockedOut, this.viewInfo.canEditLockedOutState);
				items.push(this.lockedOutCheckbox);
				this.lockedOutCheckbox.onChanged(() => {
					this.objectInfo.isLockedOut = this.lockedOutCheckbox.checked;
					this.onObjectValueChange();
				});
			}
		}

		this.sqlAuthSection = this.createGroup(view, localizedConstants.SQLAuthenticationSectionHeader, items);
	}

	private initializeAdvancedSection(view: azdata.ModelView): void {
		const items: azdata.Component[] = [];
		if (this.viewInfo.supportAdvancedOptions) {
			this.defaultDatabaseDropdown = view.modelBuilder.dropDown().withProps({
				ariaLabel: localizedConstants.DefaultDatabaseText,
				values: this.viewInfo.databases,
				value: this.objectInfo.defaultDatabase,
				width: DefaultInputWidth
			}).component();
			const defaultDatabaseContainer = this.createLabelInputContainer(view, localizedConstants.DefaultDatabaseText, this.defaultDatabaseDropdown);
			this.defaultDatabaseDropdown.onValueChanged(() => {
				this.objectInfo.defaultDatabase = <string>this.defaultDatabaseDropdown.value;
				this.onObjectValueChange();
			});

			this.defaultLanguageDropdown = view.modelBuilder.dropDown().withProps({
				ariaLabel: localizedConstants.DefaultLanguageText,
				values: this.viewInfo.languages,
				value: this.objectInfo.defaultLanguage,
				width: DefaultInputWidth
			}).component();
			const defaultLanguageContainer = this.createLabelInputContainer(view, localizedConstants.DefaultLanguageText, this.defaultLanguageDropdown);
			this.defaultLanguageDropdown.onValueChanged(() => {
				this.objectInfo.defaultLanguage = <string>this.defaultLanguageDropdown.value;
				this.onObjectValueChange();
			});

			this.connectPermissionCheckbox = this.createCheckbox(view, localizedConstants.PermissionToConnectText, this.objectInfo.connectPermission);
			this.connectPermissionCheckbox.onChanged(() => {
				this.objectInfo.connectPermission = this.connectPermissionCheckbox.checked;
				this.onObjectValueChange();
			});
			items.push(defaultDatabaseContainer, defaultLanguageContainer, this.connectPermissionCheckbox);
		}

		this.advancedSection = this.createGroup(view, localizedConstants.AdvancedSectionHeader, items);
	}

	private initializeServerRolesSection(view: azdata.ModelView): void {
		const serverRolesData = this.viewInfo.serverRoles.map(name => {
			const isRoleSelected = this.objectInfo.serverRoles.indexOf(name) !== -1;
			const isRoleSelectionEnabled = name !== PublicServerRoleName;
			return [{ enabled: isRoleSelectionEnabled, checked: isRoleSelected }, name];
		});
		this.serverRoleTable = this.createTableList(view, localizedConstants.ServerRoleSectionHeader, this.viewInfo.serverRoles, this.objectInfo.serverRoles, serverRolesData);
		this.serverRoleSection = this.createGroup(view, localizedConstants.ServerRoleSectionHeader, [this.serverRoleTable]);
	}

	private setViewByAuthenticationType(): void {
		if (this.authTypeDropdown.value === localizedConstants.SQLAuthenticationTypeDisplayText) {
			this.addItem(this.formContainer, this.sqlAuthSection, 1);
		} else if (this.authTypeDropdown.value !== localizedConstants.SQLAuthenticationTypeDisplayText) {
			this.removeItem(this.formContainer, this.sqlAuthSection);
		}
	}
}
