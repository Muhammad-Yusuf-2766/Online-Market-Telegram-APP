import { Avatar, Box, Group, Stack, Text } from '@mantine/core';
import type { ReferralTreeNode } from '../../app/parfumApi';

function NodeView({ node }: { node: ReferralTreeNode }) {
  const label = [node.firstName, node.lastName].filter(Boolean).join(' ') || '?';
  const initials = label
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  return (
    <Stack gap={4} align="center" miw={88} maw={120}>
      <Avatar radius="xl" size="md" color="parfum">
        {initials}
      </Avatar>
      <Text size="xs" ta="center" lineClamp={2} title={label}>
        {label}
      </Text>
      <Text size="10px" c="dimmed" ff="monospace" truncate title={node.referralCode}>
        {node.referralCode}
      </Text>
    </Stack>
  );
}

function Branch({
  node,
  depth,
  maxDepth,
}: {
  node: ReferralTreeNode;
  depth: number;
  maxDepth: number;
}) {
  const showChildren = node.children.length > 0 && depth < maxDepth;

  return (
    <Box style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <NodeView node={node} />
      {showChildren ? (
        <Box
          pt="sm"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Box
            h={10}
            w={2}
            style={{ background: 'var(--mantine-color-gray-4)' }}
          />
          <Group gap="lg" align="flex-start" wrap="nowrap" justify="center">
            {node.children.map((ch) => (
              <Box
                key={ch.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                }}
              >
                <Box
                  h={10}
                  w={2}
                  style={{ background: 'var(--mantine-color-gray-4)' }}
                />
                <Branch node={ch} depth={depth + 1} maxDepth={maxDepth} />
              </Box>
            ))}
          </Group>
        </Box>
      ) : null}
    </Box>
  );
}

export function AdminReferralTree({
  root,
  maxDepth,
}: {
  root: ReferralTreeNode;
  maxDepth: number;
}) {
  return (
    <Box
      style={{
        overflowX: 'auto',
        padding: '8px 0 16px',
        maxWidth: '100%',
      }}
    >
      <Branch node={root} depth={0} maxDepth={maxDepth} />
    </Box>
  );
}
