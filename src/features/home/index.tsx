import React from 'react';
import { View, Text, Button } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { styles } from './styles';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

const HomeScreen = ({ navigation }: Props) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to Explorify</Text>
      <Text style={styles.subtitle}>Your journey starts here</Text>
      <Button
        title="Go to Details"
        onPress={() => navigation.navigate('Details', { itemId: 1 })}
      />
    </View>
  );
};

export default HomeScreen;
