import React, { ReactNode } from 'react';
import { Box } from 'folds';

type ClientLayoutProps = {
  nav: ReactNode;
  children: ReactNode;
  header?: ReactNode; // <-- ADD THIS (optional)
};

export function ClientLayout({ nav, header, children }: ClientLayoutProps) {
  return (
<>
      {header && <Box direction="Column" shrink="No">
        <Box
          style={{ padding: `0 0` }}
          alignItems="Center"
          justifyContent="Center"
        >
{header}        </Box>
      </Box>

    } {/* <-- ADD THIS */}
    <Box grow="Yes">

      <Box shrink="No">{nav}</Box>
      <Box grow="Yes">{children}</Box>
    </Box>
    </>
  );
}
