import * as React from 'react'
import WizardNavButtons from './WizardNavButtons';
import WizardPageNav from './WizardPageNav';
import WizardTitle from './WizardTitle';
import SelectAction from './pages/SelectAction';
import State from './State';

interface AppProps { }

function App({ }: AppProps) {
	const state: State = {
		currentPage: 1,
		numPages: 4
	}

	React.useEffect(() => {

	}, [state]);

	return (
		<div className='flex flex-col min-h-screen w-screen grow break-all bg-[color:var(--vscode-editor-background)]'>
			<WizardTitle title="Data-Tier Application Wizard" />
			<div className='flex h-auto w-screen flex-row grow'>
				<WizardPageNav currentPage={state.currentPage} numPages={state.numPages} />
				<SelectAction />
			</div>
			<WizardNavButtons previousEnabled={state.currentPage > 1} nextEnabled={state.currentPage < state.numPages} />
		</div>
	)
}

export default App
