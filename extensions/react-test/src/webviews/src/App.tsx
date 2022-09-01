import * as React from 'react'
import WizardNavButtons from './WizardNavButtons';
import WizardPageNav from './WizardPageNav';
import WizardTitle from './WizardTitle';
import SelectAction from './pages/SelectAction';

interface AppProps { }

function App({ }: AppProps) {
	return (
		<div className="flex min-h-screen w-screen flex-col grow break-all bg-pink-800">
			<WizardTitle title="Data-Tier Application Wizard" />
			<div className='flex h-auto w-screen flex-row grow'>
				<WizardPageNav currentPage={2} />
				<SelectAction />
			</div>
			<WizardNavButtons previousEnabled={false} nextEnabled={true} />
		</div>
	)
}

export default App
