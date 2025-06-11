import { CallContextProvider } from './CallContext'
import CallControls from './CallControls'
import Conversation from './Conversation'
import DevicesSettings from './DevicesSettings'
import VADSettings from './VADSettings'

export default function App() {
  return (
    <CallContextProvider>
      <div className="h-screen w-full flex flex-col lg:flex-row">
        <div className="lg:flex-1 flex flex-col p-6 gap-6 border-b lg:border-b-0 lg:border-r border-gray-200 bg-white">
          <CallControls />
          <DevicesSettings />
          <VADSettings />
        </div>
        <Conversation className="flex-1 bg-gray-50" />
      </div>
    </CallContextProvider>
  )
}
