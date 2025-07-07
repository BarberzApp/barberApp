import { AppNavigator } from './app/navigation/AppNavigator'
import { AuthProvider, useAuth } from './app/hooks/useAuth';

const App = () => (
    <AuthProvider>
        <AppNavigator />
    </AuthProvider>
);

export default App;