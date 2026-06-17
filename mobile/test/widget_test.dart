import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:goalnest/app.dart';

void main() {
  testWidgets('GoalNest app renders login when not authenticated', (tester) async {
    await tester.pumpWidget(const ProviderScope(child: GoalNestApp()));
    await tester.pumpAndSettle();
    expect(find.text('Welcome to GoalNest'), findsOneWidget);
  });
}
