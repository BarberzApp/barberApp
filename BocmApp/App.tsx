import { AppNavigator } from './app/navigation/AppNavigator'
import { AuthProvider } from './app/hooks/useAuth';
// import * as Font from 'expo-font';
// import { useEffect, useState } from 'react';
// import { Text } from 'react-native';

const App = () => {
    // const [fontsLoaded, setFontsLoaded] = useState(false);

    // useEffect(() => {
    //     (async () => {
    //         try {
    //             await Font.loadAsync({
    //                 'BebasNeue': require('./assets/fonts/BebasNeue-Regular.ttf'),
    //             });
    //             setFontsLoaded(true);
    //         } catch (e) {
    //             console.error('Font loading error:', e);
    //         }
    //     })();
    // }, []);

    // if (!fontsLoaded) return <Text>Loading fonts...</Text>;

    return (
        <AuthProvider>
            <AppNavigator />
        </AuthProvider>
    );
};

export default App;