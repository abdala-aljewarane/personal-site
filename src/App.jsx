import { useState } from 'react'

import Sidenav from './components/Sidenav'
import Main from './components/Main'
import CreateApp from './components/CreateApp'
import WriteBook from './components/WriteBook'
import Design from './components/Design'

function App() {
  
  return (
    <>
      <div>
        <Sidenav />
        <Main />
        <CreateApp />
        <WriteBook />
        <Design />
      </div>
      
    </>
  )
}

export default App