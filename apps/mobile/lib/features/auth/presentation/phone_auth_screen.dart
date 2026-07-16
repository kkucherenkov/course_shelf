import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import 'package:app_mobile/features/auth/presentation/bloc/auth_cubit.dart';
import 'package:app_mobile/features/auth/presentation/bloc/auth_state.dart';
import 'package:app_mobile/features/auth/presentation/widgets/auth_banners.dart';
import 'package:app_mobile/i18n/strings.g.dart';
import 'package:app_mobile/shared/di/injector.dart';

/// Secondary sign-in path: phone + OTP. Two internal steps driven by
/// [AuthState.status]:
///   - phone → user types their number and name, tapping submit requests a code.
///   - otp   → user types the 6-digit code; tapping submit verifies it.
///
/// Email + password ([SignInScreen]) is the primary path; this screen is
/// reached from the "sign in with phone instead" link.
class PhoneAuthScreen extends StatelessWidget {
  const PhoneAuthScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocProvider<AuthCubit>(
      create: (_) => getIt<AuthCubit>(),
      child: const _PhoneAuthView(),
    );
  }
}

class _PhoneAuthView extends StatefulWidget {
  const _PhoneAuthView();

  @override
  State<_PhoneAuthView> createState() => _PhoneAuthViewState();
}

class _PhoneAuthViewState extends State<_PhoneAuthView> {
  final _phoneCtrl = TextEditingController();
  final _nameCtrl = TextEditingController();
  final _otpCtrl = TextEditingController();

  @override
  void dispose() {
    _phoneCtrl.dispose();
    _nameCtrl.dispose();
    _otpCtrl.dispose();
    super.dispose();
  }

  void _requestOtp() {
    context.read<AuthCubit>().requestOtp(phone: _phoneCtrl.text.trim());
  }

  void _verifyOtp(String phone) {
    context.read<AuthCubit>().verifyOtp(
          phone: phone,
          code: _otpCtrl.text.trim(),
          name: _nameCtrl.text.trim(),
        );
  }

  @override
  Widget build(BuildContext context) {
    final tPhone = context.t.auth.phone;
    final tOtp = context.t.auth.otp;

    return BlocListener<AuthCubit, AuthState>(
      listener: (context, state) {
        if (state.status == AuthStatus.authenticated) {
          // Pop back to root after successful auth — AuthGate will redirect.
          Navigator.popUntil(context, (route) => route.isFirst);
        }
        if (state.status == AuthStatus.otpSent) {
          _otpCtrl.clear();
        }
      },
      child: BlocBuilder<AuthCubit, AuthState>(
        builder: (context, state) {
          final isOtpStep = state.status == AuthStatus.otpSent ||
              (state.status == AuthStatus.authenticating && state.phone != null);
          final isLoading = state.status == AuthStatus.authenticating;
          final theme = Theme.of(context);

          return Scaffold(
            appBar: AppBar(
              title: Text(isOtpStep ? tOtp.title : tPhone.title),
              leading: isOtpStep
                  ? IconButton(
                      icon: const Icon(Icons.arrow_back),
                      onPressed: () => context.read<AuthCubit>().resetToPhoneStep(),
                    )
                  : null,
            ),
            body: SafeArea(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(32),
                child: isOtpStep
                    ? _OtpStep(
                        tOtp: tOtp,
                        state: state,
                        otpCtrl: _otpCtrl,
                        theme: theme,
                        isLoading: isLoading,
                        phoneText: _phoneCtrl.text.trim(),
                        onVerify: () => _verifyOtp(state.phone ?? _phoneCtrl.text.trim()),
                        onResend: _requestOtp,
                        onChangePhone: () => context.read<AuthCubit>().resetToPhoneStep(),
                      )
                    : _PhoneStep(
                        tPhone: tPhone,
                        state: state,
                        phoneCtrl: _phoneCtrl,
                        nameCtrl: _nameCtrl,
                        theme: theme,
                        isLoading: isLoading,
                        onSubmit: _requestOtp,
                      ),
              ),
            ),
          );
        },
      ),
    );
  }
}

class _PhoneStep extends StatelessWidget {
  const _PhoneStep({
    required this.tPhone,
    required this.state,
    required this.phoneCtrl,
    required this.nameCtrl,
    required this.theme,
    required this.isLoading,
    required this.onSubmit,
  });

  final TranslationsAuthPhoneEn tPhone;
  final AuthState state;
  final TextEditingController phoneCtrl;
  final TextEditingController nameCtrl;
  final ThemeData theme;
  final bool isLoading;
  final VoidCallback onSubmit;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(
          tPhone.subtitle,
          style: theme.textTheme.bodyMedium?.copyWith(
            color: theme.colorScheme.onSurfaceVariant,
          ),
        ),
        const SizedBox(height: 24),
        TextField(
          controller: phoneCtrl,
          keyboardType: TextInputType.phone,
          autofillHints: const [AutofillHints.telephoneNumber],
          inputFormatters: [
            FilteringTextInputFormatter.allow(RegExp(r'[\d+\s\-()]')),
          ],
          decoration: InputDecoration(
            labelText: tPhone.phoneLabel,
            hintText: tPhone.phoneHint,
            border: const OutlineInputBorder(),
          ),
        ),
        const SizedBox(height: 24),
        TextField(
          controller: nameCtrl,
          autofillHints: const [AutofillHints.name],
          decoration: InputDecoration(
            labelText: tPhone.nameLabel,
            hintText: tPhone.nameHint,
            border: const OutlineInputBorder(),
          ),
        ),
        if (state.status == AuthStatus.error && state.errorMessage != null) ...[
          const SizedBox(height: 16),
          AuthErrorBanner(message: tPhone.errorInvalid),
        ],
        const SizedBox(height: 32),
        FilledButton(
          onPressed: isLoading ? null : onSubmit,
          child: isLoading
              ? const SizedBox(
                  height: 16,
                  width: 16,
                  child: CircularProgressIndicator(strokeWidth: 2),
                )
              : Text(tPhone.submit),
        ),
      ],
    );
  }
}

class _OtpStep extends StatelessWidget {
  const _OtpStep({
    required this.tOtp,
    required this.state,
    required this.otpCtrl,
    required this.theme,
    required this.isLoading,
    required this.phoneText,
    required this.onVerify,
    required this.onResend,
    required this.onChangePhone,
  });

  final TranslationsAuthOtpEn tOtp;
  final AuthState state;
  final TextEditingController otpCtrl;
  final ThemeData theme;
  final bool isLoading;
  final String phoneText;
  final VoidCallback onVerify;
  final VoidCallback onResend;
  final VoidCallback onChangePhone;

  @override
  Widget build(BuildContext context) {
    final phone = state.phone ?? phoneText;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(
          tOtp.subtitleWithPhone(phone: phone),
          style: theme.textTheme.bodyMedium?.copyWith(
            color: theme.colorScheme.onSurfaceVariant,
          ),
        ),
        const SizedBox(height: 16),
        if (kDebugMode) ...[
          AuthInfoBanner(
            title: tOtp.devBannerTitle,
            description: tOtp.devBannerBody,
          ),
          const SizedBox(height: 16),
        ],
        const SizedBox(height: 8),
        TextField(
          controller: otpCtrl,
          keyboardType: TextInputType.number,
          autofillHints: const [AutofillHints.oneTimeCode],
          maxLength: 6,
          inputFormatters: [FilteringTextInputFormatter.digitsOnly],
          decoration: InputDecoration(
            labelText: tOtp.otpLabel,
            hintText: tOtp.otpHint,
            border: const OutlineInputBorder(),
          ),
        ),
        if (state.errorMessage != null) ...[
          const SizedBox(height: 16),
          AuthErrorBanner(
            message: switch (state.errorMessage!) {
              'otp-mismatch' => tOtp.errorMismatch,
              'otp-expired' => tOtp.errorExpired,
              'otp-missing' => tOtp.errorMissing,
              'otp-invalid' => tOtp.errorInvalid,
              final other => tOtp.errorGeneric(error: other),
            },
          ),
        ],
        const SizedBox(height: 32),
        FilledButton(
          onPressed: isLoading ? null : onVerify,
          child: isLoading
              ? const SizedBox(
                  height: 16,
                  width: 16,
                  child: CircularProgressIndicator(strokeWidth: 2),
                )
              : Text(tOtp.submit),
        ),
        const SizedBox(height: 16),
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            TextButton(
              onPressed: isLoading ? null : onResend,
              child: Text(tOtp.resend),
            ),
            TextButton(
              onPressed: isLoading ? null : onChangePhone,
              child: Text(tOtp.changePhone),
            ),
          ],
        ),
      ],
    );
  }
}
