import { Canvas } from '@react-three/fiber/native';
import { StyleSheet, View } from 'react-native';
import type { PuzzleController } from '@/core/puzzle-controller';
import { PuzzleScene } from './puzzle-scene';

export function PuzzleCanvas({ controller }: { controller: PuzzleController }) {
  return <View style={styles.container}><Canvas camera={{ position: [4.6, 3.8, 5.8], fov: 42 }}><color attach="background" args={['#15121d']} /><ambientLight intensity={1.7} /><directionalLight position={[4, 7, 5]} intensity={2.2} /><PuzzleScene controller={controller} /></Canvas></View>;
}
const styles = StyleSheet.create({ container: { height: 310, borderRadius: 18, overflow: 'hidden', backgroundColor: '#15121d' } });
