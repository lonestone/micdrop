import { PiCloudBold, PiDesktopBold } from 'react-icons/pi'
import CallDock from './components/CallDock'
import DetectionPanels from './components/DetectionPanels'
import DevicesPanel from './components/DevicesPanel'
import RailHeading from './components/RailHeading'
import ServerPanel from './components/ServerPanel'
import TopBar from './components/TopBar'
import Transcript from './components/Transcript'

/**
 * The workspace: settings on the left, the call on the right.
 *
 * The rail is sorted by where a setting acts rather than by what it is named,
 * because that is what decides whether moving it takes effect now or on the
 * next call. On a narrow screen the call comes first, since a phone is held to
 * talk into rather than to tune thresholds on.
 */
export default function App() {
  return (
    <div className="flex min-h-dvh flex-col bg-base text-main lg:h-dvh">
      <TopBar />

      {/*
        Below `lg` the page is one column that simply scrolls. The two panes
        only become independently scrolling columns once there is the height
        for it, since a grid row told to fill a locked viewport collapses
        whatever sits in it on a phone.
      */}
      <main
        className="mx-auto grid w-full max-w-[110rem] grid-cols-1 gap-4 p-4
          lg:min-h-0 lg:flex-1 lg:grid-cols-[24rem_minmax(0,1fr)] lg:overflow-hidden"
      >
        <aside className="order-2 flex flex-col gap-3 lg:order-1 lg:min-h-0 lg:overflow-y-auto lg:pr-1">
          <RailHeading
            title="On the server"
            description="Applied on the next call"
            icon={<PiCloudBold className="h-3.5 w-3.5" />}
          />
          <ServerPanel />

          <RailHeading
            title="In the browser"
            description="Applied right away"
            icon={<PiDesktopBold className="h-3.5 w-3.5" />}
          />
          <DevicesPanel />
          <DetectionPanels />
        </aside>

        <section className="order-1 flex flex-col gap-3 lg:order-2 lg:min-h-0">
          <Transcript className="max-h-[60dvh] min-h-64 flex-1 lg:max-h-none" />
          <CallDock />
        </section>
      </main>
    </div>
  )
}
