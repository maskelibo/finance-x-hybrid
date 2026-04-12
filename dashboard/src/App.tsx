import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import GenelBakis from './pages/GenelBakis'
import CEOChat from './pages/CEOChat'
import CEOAktivite from './pages/CEOAktivite'
import Organizasyon from './pages/Organizasyon'
import IsAkisi from './pages/IsAkisi'
import AnalizBaslat from './pages/AnalizBaslat'
import Agentlar from './pages/Agentlar'
import Gorevler from './pages/Gorevler'
import KapOlaylari from './pages/KapOlaylari'
import Raporlar from './pages/Raporlar'
import Maliyetler from './pages/Maliyetler'
import Karsilastir from './pages/Karsilastir'
import Ayarlar from './pages/Ayarlar'

const App: React.FC = () => {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<GenelBakis />} />
        <Route path="/ceo" element={<CEOChat />} />
        <Route path="/ceo-aktivite" element={<CEOAktivite />} />
        <Route path="/organizasyon" element={<Organizasyon />} />
        <Route path="/is-akisi" element={<IsAkisi />} />
        <Route path="/analiz" element={<AnalizBaslat />} />
        <Route path="/agentlar" element={<Agentlar />} />
        <Route path="/gorevler" element={<Gorevler />} />
        <Route path="/kap-olaylari" element={<KapOlaylari />} />
        <Route path="/raporlar" element={<Raporlar />} />
        <Route path="/karsilastir" element={<Karsilastir />} />
        <Route path="/maliyetler" element={<Maliyetler />} />
        <Route path="/ayarlar" element={<Ayarlar />} />
      </Route>
    </Routes>
  )
}

export default App
