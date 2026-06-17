import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import '../../core/theme/app_theme.dart';

class HealthScoreRing extends StatelessWidget {
  const HealthScoreRing({super.key, required this.score, required this.grade});

  final int score;
  final String grade;

  @override
  Widget build(BuildContext context) {
    final color = score >= 80
        ? AppTheme.primaryLight
        : score >= 60
            ? Colors.amber
            : Colors.red.shade400;

    return SizedBox(
      height: 140,
      width: 140,
      child: Stack(
        alignment: Alignment.center,
        children: [
          PieChart(
            PieChartData(
              sectionsSpace: 0,
              centerSpaceRadius: 50,
              startDegreeOffset: -90,
              sections: [
                PieChartSectionData(
                  value: score.toDouble(),
                  color: color,
                  radius: 14,
                  showTitle: false,
                ),
                PieChartSectionData(
                  value: (100 - score).toDouble(),
                  color: Colors.grey.shade200,
                  radius: 14,
                  showTitle: false,
                ),
              ],
            ),
          ),
          Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text('$score', style: const TextStyle(fontSize: 28, fontWeight: FontWeight.bold)),
              Text('Grade $grade', style: TextStyle(fontSize: 12, color: Colors.grey.shade600)),
            ],
          ),
        ],
      ),
    );
  }
}
