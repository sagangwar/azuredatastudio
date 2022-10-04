import * as React from 'react';

type WizardTitleProps = {
	title: string
}

const WizardTitle: React.FunctionComponent<WizardTitleProps> = props => {
	return (
		<div className="h-8 w-screen bg-[color:var(--vscode-editor-background)] p-4">
			<h2 className="text-[26px] leading-[30px] font-medium my-0">
				{props.title}
			</h2>
		</div>
	);
}

export default WizardTitle;
