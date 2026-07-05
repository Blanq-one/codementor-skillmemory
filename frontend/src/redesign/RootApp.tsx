import { MotionConfig } from "motion/react"
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"

import { ReposProvider } from "./repos-context"
import { Landing } from "./Landing"
import { Workspace } from "./Workspace"

/**
 * Production root with real URL routing:
 *   /                  -> landing hub (add a repo / open a studied repo)
 *   /repo/:repoId/*    -> that repo's workspace (chat / telemetry / skills)
 *   anything else      -> redirect home
 *
 * Real routes mean browser back/forward and refresh land in the right place.
 * The scripted mock still lives on the dev-only /_* routes (see main.tsx).
 */
export function RootApp() {
  return (
    <BrowserRouter>
      <MotionConfig reducedMotion="user">
        <ReposProvider>
          <Routes>
            <Route element={<Landing />} path="/" />
            <Route element={<Workspace />} path="/repo/:repoId/*" />
            <Route element={<Navigate replace to="/" />} path="*" />
          </Routes>
        </ReposProvider>
      </MotionConfig>
    </BrowserRouter>
  )
}

export default RootApp
