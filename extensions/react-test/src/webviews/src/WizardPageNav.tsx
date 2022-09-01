import { VSCodeButton } from '@vscode/webview-ui-toolkit/react';
import * as React from 'react';
import { Command, VSCodeAPI } from './VSCodeAPI';

type WizardPageNavProps = {
	currentPage: number
}

const numPages = 4;

const WizardPageNav: React.FunctionComponent<WizardPageNavProps> = props => {
	return (
		<div className="w-32 bg-yellow-800">
			{[...Array(numPages)].map((e, i) => (
				<svg className="stroke-purple-600 fill-purple-200" onClick={() => pageClicked(i+1)}>
					<g transform='translate(24, 24)'>
						<circle r="20" />
						<text textAnchor='middle' alignmentBaseline='central'>{i+1}</text>
					</g>
				</svg>
			))}
		</div>
	);
}

function pageClicked(pageNum: number) {
	VSCodeAPI.postMessage(Command.alert, `Clicked page ${pageNum}`);
}

export default WizardPageNav;
