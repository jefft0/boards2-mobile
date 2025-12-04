import React, { useRef, useState } from 'react'
import { Animated, View, StyleSheet } from 'react-native'
import Icons from '../icons'
import CardFooterButton from '../cards/CardFooterButton'

interface GnodLikeButtonProps {
  isLiked?: boolean
  hideLabel?: boolean
  onPress?: (liked: boolean) => void
  size?: number
  likedColor?: string
  unlikedColor?: string
  gnodCount?: number
}

interface Sparkle {
  id: number
  scale: Animated.Value
  translateX: Animated.Value
  translateY: Animated.Value
  opacity: Animated.Value
  rotation: Animated.Value
}

export default function GnodLikeButton({
  isLiked: initialIsLiked = false,
  hideLabel = false,
  onPress,
  size = 24,
  likedColor = '#266000',
  unlikedColor = '#9ca3af',
  gnodCount = 0
}: GnodLikeButtonProps) {
  const [isLiked, setIsLiked] = useState(initialIsLiked)
  const [sparkles, setSparkles] = useState<Sparkle[]>([])

  // Animation values
  const scaleAnim = useRef(new Animated.Value(1)).current
  const burstScale = useRef(new Animated.Value(0)).current
  const burstOpacity = useRef(new Animated.Value(0)).current

  const createSparkles = () => {
    const sparkleCount = 6
    const newSparkles: Sparkle[] = []

    for (let i = 0; i < sparkleCount; i++) {
      newSparkles.push({
        id: Date.now() + i,
        scale: new Animated.Value(0),
        translateX: new Animated.Value(0),
        translateY: new Animated.Value(0),
        opacity: new Animated.Value(0),
        rotation: new Animated.Value(0)
      })
    }

    setSparkles(newSparkles)

    // Animate sparkles
    newSparkles.forEach((sparkle, i) => {
      const angle = (i / sparkleCount) * Math.PI * 2
      const distance = size * 1.2
      const randomOffset = (Math.random() - 0.5) * 20

      Animated.parallel([
        Animated.timing(sparkle.scale, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true
        }),
        Animated.timing(sparkle.translateX, {
          toValue: Math.cos(angle) * distance + randomOffset,
          duration: 400,
          useNativeDriver: true
        }),
        Animated.timing(sparkle.translateY, {
          toValue: Math.sin(angle) * distance + randomOffset,
          duration: 400,
          useNativeDriver: true
        }),
        Animated.timing(sparkle.rotation, {
          toValue: 360,
          duration: 400,
          useNativeDriver: true
        }),
        Animated.sequence([
          Animated.timing(sparkle.opacity, {
            toValue: 1,
            duration: 150,
            useNativeDriver: true
          }),
          Animated.timing(sparkle.opacity, {
            toValue: 0,
            duration: 250,
            useNativeDriver: true
          })
        ])
      ]).start()
    })

    // Clean up sparkles after animation
    setTimeout(() => {
      setSparkles([])
    }, 500)
  }

  const handlePress = () => {
    const newLikedState = !isLiked
    setIsLiked(newLikedState)
    onPress?.(newLikedState)

    if (newLikedState) {
      // Create sparkles
      createSparkles()

      // Like animation sequence
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 100,
          useNativeDriver: true
        }),
        Animated.spring(scaleAnim, {
          toValue: 1.2,
          friction: 3,
          tension: 200,
          useNativeDriver: true
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 4,
          tension: 100,
          useNativeDriver: true
        })
      ]).start()

      // Burst circle animation
      Animated.parallel([
        Animated.timing(burstScale, {
          toValue: 2.5,
          duration: 400,
          useNativeDriver: true
        }),
        Animated.timing(burstOpacity, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true
        }),
        Animated.timing(burstOpacity, {
          toValue: 0,
          duration: 300,
          delay: 100,
          useNativeDriver: true
        })
      ]).start(() => {
        burstScale.setValue(0)
        burstOpacity.setValue(0)
      })
    } else {
      // Unlike animation
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 0.9,
          duration: 100,
          useNativeDriver: true
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true
        })
      ]).start()
    }
  }

  return (
    <CardFooterButton onPress={handlePress} label="Gnods" count={gnodCount} hideLabel={hideLabel}>
      {/* <TouchableOpacity activeOpacity={0.7} onPress={handlePress} style={styles.container}> */}
      <View style={styles.iconContainer}>
        {/* Burst circle effect */}
        <Animated.View
          style={[
            styles.burstCircle,
            {
              width: size * 2,
              height: size * 2,
              borderRadius: size,
              borderColor: likedColor,
              opacity: burstOpacity,
              transform: [{ scale: burstScale }]
            }
          ]}
        />

        {/* Sparkles */}
        {sparkles.map((sparkle) => (
          <Animated.View
            key={sparkle.id}
            style={[
              styles.sparkle,
              {
                opacity: sparkle.opacity,
                transform: [
                  { translateX: sparkle.translateX },
                  { translateY: sparkle.translateY },
                  { scale: sparkle.scale },
                  {
                    rotate: sparkle.rotation.interpolate({
                      inputRange: [0, 360],
                      outputRange: ['0deg', '360deg']
                    })
                  }
                ]
              }
            ]}
          >
            <View style={[styles.sparkleShape, { backgroundColor: likedColor }]} />
          </Animated.View>
        ))}

        {/* Main icon */}
        <Animated.View
          style={{
            transform: [{ scale: scaleAnim }]
          }}
        >
          <Icons.Gnod
            isLiked={isLiked}
            width={size}
            height={size * 1.125}
            fill={isLiked ? likedColor : unlikedColor}
            stroke={isLiked ? likedColor : unlikedColor}
          />
        </Animated.View>
      </View>
    </CardFooterButton>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8
  },
  iconContainer: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center'
  },
  burstCircle: {
    position: 'absolute',
    borderWidth: 2,
    backgroundColor: 'transparent'
  },
  sparkle: {
    position: 'absolute',
    width: 8,
    height: 8,
    justifyContent: 'center',
    alignItems: 'center'
  },
  sparkleShape: {
    width: 4,
    height: 4,
    borderRadius: 2,
    shadowColor: '#15803d',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 3,
    elevation: 5
  }
})
