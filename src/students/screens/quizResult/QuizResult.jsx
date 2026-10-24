import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Container,
  Paper,
  Button,
} from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

import {
  containerStyle,
  paperStyle,
  finalScoreText,
  subtitleText,
  statsContainer,
  correctBox,
  wrongBox,
  chartContainer,
  backButton,
} from "./QuizResultHorizontal.styles";

const COLORS = ["#4caf50", "#f44336"]; // Correct - Wrong

export default function QuizResultHorizontal() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const result = state?.result;

  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    if (!result) return;
    let start = 0;
    const end = Number(result.score);
    if (!Number.isFinite(end) || end <= 0) {
      setAnimatedScore(Number.isFinite(end) ? end : 0);
      return;
    }
    const duration = 1000;
    const stepTime = Math.max(Math.floor(duration / end), 10);
    const timer = setInterval(() => {
      start += 1;
      if (start > end) clearInterval(timer);
      else setAnimatedScore(start);
    }, stepTime);
    return () => clearInterval(timer);
  }, [result]);

  if (!result)
    return (
      <Typography sx={{ mt: 4, textAlign: "center" }}>
        Result not found
      </Typography>
    );

  const data = [
    { name: "Correct", value: result.correctCount },
    { name: "Wrong", value: result.wrongCount },
  ];

  return (
    <Container maxWidth="sm" sx={containerStyle}>
      <Paper elevation={10} sx={paperStyle}>
        <Typography variant="h5" sx={finalScoreText}>
          Final Score: {animatedScore}
        </Typography>
        <Typography variant="subtitle1" sx={subtitleText}>
          Time Taken: {result.timeTaken} mins
        </Typography>

        {/* Boxes Horizontal */}
        <Box sx={statsContainer}>
          <Box sx={correctBox}>
            <Typography variant="h6">Correct</Typography>
            <Typography variant="h4">{result.correctCount}</Typography>
          </Box>
          <Box sx={wrongBox}>
            <Typography variant="h6">Wrong</Typography>
            <Typography variant="h4">{result.wrongCount}</Typography>
          </Box>
        </Box>

        {/* Pie Chart */}
        <Box sx={chartContainer}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                label={({ name, percent }) =>
                  `${name} ${(percent * 100).toFixed(0)}%`
                }
                isAnimationActive
              >
                {data.map((entry, index) => (
                  <Cell
                    key={index}
                    fill={COLORS[index % COLORS.length]}
                    stroke="#fff"
                    strokeWidth={2}
                  />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`${value}`, "Questions"]} />
            </PieChart>
          </ResponsiveContainer>
        </Box>

        <Button
          variant="contained"
          size="large"
          sx={backButton}
          onClick={() => navigate("/student")}
        >
          Back to Dashboard
        </Button>
      </Paper>
    </Container>
  );
}
