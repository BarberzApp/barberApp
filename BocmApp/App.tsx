import { AppNavigator } from './app/navigation/AppNavigator'
import { AuthProvider } from './app/hooks/useAuth';
import * as Font from 'expo-font';
import { useEffect, useState } from 'react';

const App = () => {
    const [fontsLoaded, setFontsLoaded] = useState(false);

    useEffect(() => {
        (async () => {
            await Font.loadAsync({
                'BebasNeue': require('./assets/fonts/BebasNeue-Regular.ttf'),
            });
            setFontsLoaded(true);
        })();
    }, []);

    if (!fontsLoaded) return null;

    return (
        <AuthProvider>
            <AppNavigator />
        </AuthProvider>
    );
};

export default App;