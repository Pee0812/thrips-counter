import React from 'react'
import ThripsChart from './components/ThripsChart'

export default function HomePage() {
  return (
    <main>

      <section>
        {/* Chart.js で折れ線グラフを表示 */}
        <ThripsChart />
      </section>
    </main>
  )
}
