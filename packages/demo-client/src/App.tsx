import { CallContextProvider } from './CallContext'
import CallPanel from './CallPanel'

export default function App() {
  return (
    <CallContextProvider>
      <div className="max-w-[600px] mx-auto my-10">
        <CallPanel />
      </div>
    </CallContextProvider>
  )
}
