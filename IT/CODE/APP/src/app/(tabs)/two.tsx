import { Activity, Airplay } from '@tamagui/lucide-icons'
import { Button, XGroup, XStack, YStack } from 'tamagui'

// Button Demo - Styles and Variants

export default function ButtonDemo() {
  return (
    <YStack p="$3" gap="$3">
      <Button>Plain</Button>
      <Button content="center" icon={Airplay} size="$6" bg="cyan" color="grey">
        Large
      </Button>
      <XStack gap="$2" justify="center">
        <Button size="$3" theme="accent">
          Active
        </Button>
        <Button size="$3" variant="outlined" color="red" borderColor={"red"}>
          Outlined
        </Button>
      </XStack>
      <XStack gap="$2" justify="flex-end">
        <Button themeInverse size="$3">
          Inverse
        </Button>
        <Button iconAfter={Activity} size="$3">
          iconAfter
        </Button>
      </XStack>
      <XGroup>
        <XGroup.Item>
          <Button width="50%" size="$2" disabled opacity={0.5}>
            disabled
          </Button>
        </XGroup.Item>

        <XGroup.Item>
          <Button width="50%" size="$2" chromeless>
            chromeless
          </Button>
        </XGroup.Item>
      </XGroup>
    </YStack>
  )
}
