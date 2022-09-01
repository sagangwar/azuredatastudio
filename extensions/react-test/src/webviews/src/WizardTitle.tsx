import * as React from 'react';

type WizardTitleProps = {
	title: string
}

const WizardTitle: React.FunctionComponent<WizardTitleProps> = props => {
	return (
		<div className="h-32 w-screen bg-red-800">
			<h1 className="text-[26px] leading-[30px] font-medium my-0">
				{props.title}
			</h1>
		</div>
	);
}

export default WizardTitle;
