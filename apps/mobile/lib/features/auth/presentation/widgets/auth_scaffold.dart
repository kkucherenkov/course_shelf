import 'package:app_ui/app_ui.dart';
import 'package:flutter/material.dart';

import 'package:app_mobile/features/auth/presentation/widgets/auth_brand.dart';
import 'package:app_mobile/i18n/strings.g.dart';

/// Single-pane shell shared by the three auth screens.
///
/// `cs-mobile-auth`'s `PhoneScreen`: optional back link, brand lockup, then the
/// form — with the primary action pinned to the bottom rather than scrolling
/// with the content (card: "sticky primary action at the bottom").
///
/// [showBack] is false only on sign-in, which is the root of the
/// unauthenticated stack (`<PhoneScreen back={false}>` in the mockup).
class AuthScaffold extends StatelessWidget {
  const AuthScaffold({
    required this.child,
    required this.action,
    this.showBack = true,
    super.key,
  });

  /// Scrolling form content.
  final Widget child;

  /// The sticky primary action, pinned above the bottom inset.
  final Widget action;

  final bool showBack;

  @override
  Widget build(BuildContext context) {
    final t = context.t.auth;
    final media = MediaQuery.of(context);

    // Clears the iOS home indicator and Android's gesture region in one value.
    // `padding.bottom`, not `viewPadding.bottom`: it already nets off whatever
    // the keyboard covers, so the CTA reserves gesture space when the IME is
    // down and stops reserving it when the IME is up and owns that strip.
    // (`Scaffold.resizeToAvoidBottomInset` defaults true, so the body itself is
    // already lifted above the keyboard.)
    final bottomInset = media.padding.bottom;

    return Scaffold(
      // The screens draw their own back affordance inside the pane, so there is
      // no AppBar to double it up.
      body: SafeArea(
        bottom: false,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(
                AppSpacing.s5,
                AppSpacing.s4,
                AppSpacing.s5,
                0,
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (showBack)
                    Align(
                      alignment: Alignment.centerLeft,
                      child: AppButton(
                        key: const ValueKey('authBack'),
                        label: t.back,
                        variant: AppButtonVariant.ghost,
                        size: AppButtonSize.sm,
                        iconLeading: IconName.chevronLeft,
                        onPressed: () => Navigator.of(context).pop(),
                      ),
                    ),
                  const SizedBox(height: AppSpacing.s4),
                  const AuthBrand(),
                ],
              ),
            ),
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.fromLTRB(
                  AppSpacing.s5,
                  AppSpacing.s6,
                  AppSpacing.s5,
                  AppSpacing.s6,
                ),
                child: child,
              ),
            ),
            Padding(
              padding: EdgeInsets.fromLTRB(
                AppSpacing.s5,
                AppSpacing.s3,
                AppSpacing.s5,
                AppSpacing.s3 + bottomInset,
              ),
              child: action,
            ),
          ],
        ),
      ),
    );
  }
}
