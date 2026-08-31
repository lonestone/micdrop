import CallControls from './components/CallControls'
import Conversation from './components/Conversation'
import DetectionSettings from './components/DetectionSettings'
import DevicesSettings from './components/DevicesSettings'
import ServerSettings from './components/ServerSettings'

export default function App() {
  return (
    <div className="h-dvh w-full flex flex-col lg:flex-row">
      <div className="lg:flex-1 flex flex-col gap-6 overflow-y-auto p-6 border-b lg:border-b-0 lg:border-r border-gray-200 bg-white">
        <h1 className="text-xl font-semibold">Micdrop advanced demo</h1>
        <ServerSettings />
        <DevicesSettings />
        <DetectionSettings />
      </div>
      <div className="flex-1 flex flex-col min-h-0 bg-gray-50">
        {/* Above the scrolling conversation, so the call is always in reach */}
        <div className="shrink-0 border-b border-gray-200 bg-white px-6 py-3">
          <CallControls />
        </div>
        <Conversation className="flex-1 min-h-0" />
      </div>
    </div>
  )
}
