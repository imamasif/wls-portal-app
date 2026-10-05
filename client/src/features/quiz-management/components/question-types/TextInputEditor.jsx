import React from "react";
import { Box, TextInput } from "@mantine/core";

export function TextInputEditor({ currentQ, onUpdateQuestion }) {
  return (
    <Box mt="md">
      <TextInput
        label="Expected Correct Text Answer"
        placeholder="Enter exact correct string or keyword..."
        value={currentQ.correctAnswers[0] || ""}
        onChange={(e) => onUpdateQuestion({ correctAnswers: [e.target.value] })}
      />
    </Box>
  );
}
