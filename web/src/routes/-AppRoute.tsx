import App from '@app/App';

export interface AppRouteProps {
  node?: string;
  frameId?: string;
  byo?: boolean;
  eventsOpen?: boolean;
  eventsCloseTo?: string;
}

export default function AppRoute(props: AppRouteProps) {
  return <App {...props} />;
}
