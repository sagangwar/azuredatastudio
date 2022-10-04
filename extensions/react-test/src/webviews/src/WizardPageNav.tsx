import { VSCodeButton } from '@vscode/webview-ui-toolkit/react';
import * as React from 'react';
import { Command, VSCodeAPI } from './VSCodeAPI';

type WizardPageNavProps = {
	currentPage: number
	numPages: number
}

const WizardPageNav: React.FunctionComponent<WizardPageNavProps> = props => {
	return (
		<div className="flex-col w-16 bg-[color:var(--vscode-editor-background)] items-center">
			<div className='h-12 w-12' />
			{[...Array(props.currentPage - 1)].map((e, i) => (
				<>
					<svg className='w-12 h-12'>
						<g transform='translate(24, 24)' onClick={() => pageClicked(i + 1)}>
							<circle r='24' className='fill-purple-500' />
							<text textAnchor='middle' alignmentBaseline='central' className='stroke-white'>{i + 1}</text>
						</g>
					</svg>
					<svg className='stroke-purple-500 stroke-2 w-12 h-12'>
						<line x1='24' y1='0' x2='24' y2='48' />
					</svg>
				</>
			))}

			<svg className='w-12 h-12'>
				<g transform='translate(24, 24)' onClick={() => pageClicked(props.currentPage)}>
					<circle r="23" className='stroke-white stroke-2 fill-purple-500' />
					<text textAnchor='middle' alignmentBaseline='central' className='stroke-white'>{props.currentPage}</text>
				</g>
			</svg>

			{[...Array(props.currentPage)].map((e, i) => (
				<>
					<svg className='stroke-gray-400 stroke-2 w-12 h-12'>
						<line x1='24' y1='0' x2='24' y2='48' />
					</svg>
					<svg className='w-12 h-12'>
						<g transform='translate(24, 24)' onClick={() => pageClicked(props.currentPage + i + 1)}>
							<circle r="23" className='fill-gray-400' />
							<text textAnchor='middle' alignmentBaseline='central' className='stroke-white'>{props.currentPage + i + 1}</text>
						</g>
					</svg>
				</>
			))}
		</div>
	);
}

function pageClicked(pageNum: number) {
	VSCodeAPI.postMessage(Command.alert, `Clicked page ${pageNum}`);
}

export default WizardPageNav;
