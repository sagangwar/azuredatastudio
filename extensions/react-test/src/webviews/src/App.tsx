import * as React from 'react'
import {
	VSCodeButton,
	VSCodeDivider,
	VSCodeRadio,
	VSCodeRadioGroup,
} from '@vscode/webview-ui-toolkit/react'
import { RadioGroupOrientation } from '@vscode/webview-ui-toolkit/dist/radio-group';

interface AppProps { }

function App({ }: AppProps) {
	return (
		<div className="p-16 space-y-6">
			<header>
				<div className="mb-2">
					<h1 className="text-[26px] leading-[30px] font-medium my-0">
						Data Tier Application Wizard
					</h1>
				</div>
			</header>
			<VSCodeDivider />
			<VSCodeRadioGroup orientation={RadioGroupOrientation.vertical}>
				<label slot="label">Step 1: Select an Operation</label>
				<VSCodeRadio value={dacFxActions.publish} checked={true}>Deploy a data-tier application .dacpac to an instance of SQL Server [Deploy Dacpac]</VSCodeRadio>
				<VSCodeRadio value={dacFxActions.extract}>Extract a data-tier application from an instance of SQL Server to a .dacpac file [Extract Dacpac]</VSCodeRadio>
				<VSCodeRadio value={dacFxActions.import}>Create a database from a .bacpac file [Import Bacpac]</VSCodeRadio>
				<VSCodeRadio value={dacFxActions.export}>Export the schema and data from a database to the logical .bacpac file format [Export Bacpac]</VSCodeRadio>
			</VSCodeRadioGroup>
			<div className="space-x-3">
				<VSCodeButton onClick={previousClicked}>Previous</VSCodeButton>
				<VSCodeButton onClick={nextClicked}>Next</VSCodeButton>
				<VSCodeButton onClick={cancelClicked}>Cancel</VSCodeButton>
			</div>
		</div>
	)
}

const enum dacFxActions {
	publish = 'publish',
	extract = 'extract',
	import = 'import',
	export = 'export'
}

function nextClicked() {
	console.log("next clicked!");
}

function previousClicked() {
	console.log("previous clicked!");
}

function cancelClicked() {
	console.log("cancel clicked!");
}

export default App
