import { RadioGroupOrientation } from '@vscode/webview-ui-toolkit/dist/radio-group';
import { VSCodeRadio, VSCodeRadioGroup } from '@vscode/webview-ui-toolkit/react';
import * as React from 'react';
import { dacFxActions } from '../constants';

type SelectActionProps = {

}

const SelectAction: React.FunctionComponent<SelectActionProps> = props => {
	return (
		<div className='w-full bg-[color:var(--vscode-activityBar-background)] p-4'>
			<VSCodeRadioGroup orientation={RadioGroupOrientation.vertical}>
				<h3 slot='label'>Step 1: Select an Operation</h3>
				<VSCodeRadio value={dacFxActions.publish} checked={true}>Deploy a data-tier application .dacpac to an instance of SQL Server [Deploy Dacpac]</VSCodeRadio>
				<VSCodeRadio value={dacFxActions.extract}>Extract a data-tier application from an instance of SQL Server to a .dacpac file [Extract Dacpac]</VSCodeRadio>
				<VSCodeRadio value={dacFxActions.import}>Create a database from a .bacpac file [Import Bacpac]</VSCodeRadio>
				<VSCodeRadio value={dacFxActions.export}>Export the schema and data from a database to the logical .bacpac file format [Export Bacpac]</VSCodeRadio>
			</VSCodeRadioGroup>
		</div>
	);
}

export default SelectAction;
