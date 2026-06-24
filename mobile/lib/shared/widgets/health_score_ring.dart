import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import '../../core/theme/app_theme.dart';

class HealthScoreRing extends StatelessWidget {
  const HealthScoreRing({super.key, required this.score, required this.grade});

  final int score;
  final String grade;

  Color get _color {
    if (score >= 80) return AppTheme.success;
    if (score >= 60) return AppTheme.warning;
    return AppTheme.danger;
  }

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 130,
      width: 130,
      child: Stack(
        alignment: Alignment.center,
        children: [
          Container(
            width: 130,
            height: 130,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              boxShadow: [
                BoxShadow(
                  color: _color.withValues(alpha: 0.2),
                  blurRadius: 20,
                  spreadRadius: 2,
                ),
              ],
            ),
          ),
          PieChart(
            PieChartData(
              sectionsSpace: 2,
              centerSpaceRadius: 48,
              startDegreeOffset: -90,
              sections: [
                PieChartSectionData(
                  value: score.toDouble(),
                  gradient: LinearGradient(
                    colors: [_color, _color.withValues(alpha: 0.7)],
                  ),
                  radius: 16,
                  showTitle: false,
                ),
                PieChartSectionData(
                  value: (100 - score).toDouble(),
                  color: AppTheme.surfaceVariant,
                  radius: 16,
                  showTitle: false,
                ),
              ],
            ),
          ),
          Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                '$score',
                style: const TextStyle(
                  fontSize: 32,
                  fontWeight: FontWeight.w800,
                  color: AppTheme.textPrimary,
                  letterSpacing: -1,
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(
                  color: _color.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  'Grade $grade',
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                    color: _color,
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
