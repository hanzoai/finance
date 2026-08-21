import { financeMode } from '~/config'
import { Shell } from './shell'

/**
 * Rendered per request, so `FINANCE_MODE` is read from the server that is RUNNING and
 * not from the environment the image was BUILT in. Prerendering this page would bake
 * one environment's answer into the HTML, which is the same trap as reading a
 * `NEXT_PUBLIC_*` var in the browser: one image would stop serving every environment.
 */
export const dynamic = 'force-dynamic'

export default function AppPage(): React.JSX.Element {
  return <Shell mode={financeMode()} />
}
