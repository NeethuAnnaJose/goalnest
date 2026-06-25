import 'package:flutter/material.dart';

enum AppRoute {
  dashboard,
  income,
  expenses,
  savings,
  goals,
  loans,
  affordability,
  reports,
  notifications,
}

class AppNavItem {
  const AppNavItem({required this.route, required this.label, required this.icon});

  final AppRoute route;
  final String label;
  final IconData icon;
}

/// Mirrors web `mainNavItems` in navigation.ts — same labels & order.
const mainNavItems = [
  AppNavItem(route: AppRoute.dashboard, label: 'Overview', icon: Icons.space_dashboard_outlined),
  AppNavItem(route: AppRoute.income, label: 'Salary', icon: Icons.arrow_circle_up_outlined),
  AppNavItem(route: AppRoute.expenses, label: 'Spending', icon: Icons.receipt_long_outlined),
  AppNavItem(route: AppRoute.savings, label: 'Savings', icon: Icons.savings_outlined),
  AppNavItem(route: AppRoute.goals, label: 'Goals', icon: Icons.flag_outlined),
  AppNavItem(route: AppRoute.loans, label: 'Loans & EMIs', icon: Icons.account_balance_outlined),
  AppNavItem(route: AppRoute.affordability, label: 'Affordability', icon: Icons.shopping_cart_outlined),
  AppNavItem(route: AppRoute.reports, label: 'Reports', icon: Icons.description_outlined),
  AppNavItem(route: AppRoute.notifications, label: 'Alerts', icon: Icons.notifications_outlined),
];

String routeTitle(AppRoute route) {
  return mainNavItems.firstWhere((n) => n.route == route).label;
}
