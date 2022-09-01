import { VSCodeButton } from '@vscode/webview-ui-toolkit/react';
import * as React from 'react';
import { VSCodeAPI, Command } from './VSCodeAPI';

type WizardNavButtonsProps = {
	previousEnabled: boolean,
	nextEnabled: boolean
}

const WizardNavButtons: React.FunctionComponent<WizardNavButtonsProps> = props => {
	return (
		<div className="h-32 w-screen bg-green-800">
			<VSCodeButton onClick={previousClicked} disabled={!props.previousEnabled}>Previous</VSCodeButton>
			<VSCodeButton onClick={nextClicked} disabled={!props.nextEnabled}>Next</VSCodeButton>
			<VSCodeButton onClick={cancelClicked}>Cancel</VSCodeButton>
		</div>
	);
}


function nextClicked() {
	VSCodeAPI.postMessage(Command.alert, 'next clicked!');
}

function previousClicked() {
	VSCodeAPI.postMessage(Command.alert, 'previous clicked!');
}

function cancelClicked() {
	VSCodeAPI.postMessage(Command.alert, 'cancel clicked!');
}

export default WizardNavButtons;
