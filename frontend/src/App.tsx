import { Route, Switch } from 'wouter';
import Guide from './pages/Guide';
import Home from './pages/Home';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/guide" component={Guide} />
      <Route component={NotFound} />
    </Switch>
  );
}
