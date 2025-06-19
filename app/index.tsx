import TopBar from '../components/TopBar';
import { GestureResponderEvent, SafeAreaView } from 'react-native';

export default function HomeScreen() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <TopBar onMenuPress={function (event: GestureResponderEvent): void {
        throw new Error('Function not implemented.');
      } } avatarUri={''} currentXP={0} maxXP={0} currentHP={0} maxHP={0} />
      {/* później lista, FloatingButton itd. */}
    </SafeAreaView>
  );
}
