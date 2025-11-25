import { View, StyleSheet } from 'react-native'
import React from 'react'

interface BoardsHeaderProps {
  breadcrumb: React.ReactElement
  title: React.ReactElement
  actions: React.ReactElement[]
}

export const Header = ({ breadcrumb, title, actions }: BoardsHeaderProps) => {
  return (
    <View style={styles.header}>
      {breadcrumb}
      <View style={styles.title}>{title}</View>
      <View style={styles.actions}>
        {actions.map((action, index) => (
          <React.Fragment key={index}>{action}</React.Fragment>
        ))}
        {/* <ActionButton label="Create Board" onPress={onCreateBoard} icon="Add" /> */}
        {/* TODO: Implement dynamic action renderer */}
        {/* <Text.Body color="#ccc" style={styles.divider}>
          •
        </Text.Body>
        <ActionButton label="List Admin Users" onPress={onListAdminUsers} />
        <Text.Body color="#ccc" style={styles.divider}>
          •
        </Text.Body>
        <ActionButton label="Help" onPress={onHelp} /> */}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb'
  },
  title: {
    marginVertical: 8
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap'
  },
  divider: {
    marginHorizontal: 8
  }
})
