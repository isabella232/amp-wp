<?php
/**
 * Abstract class RecurringBackgroundTask.
 *
 * @package AmpProject\AmpWP
 */

namespace AmpProject\AmpWP\BackgroundTask;

/**
 * Abstract base class for using cron to execute a background task that runs on a schedule.
 *
 * @package AmpProject\AmpWP
 * @since 2.1
 * @internal
 */
abstract class RecurringBackgroundTask extends CronBasedBackgroundTask {

	/**
	 * Register the service with the system.
	 */
	public function register() {
		parent::register();

		add_action( 'admin_init', [ $this, 'schedule_event' ] );
		add_action( $this->get_event_name(), [ $this, 'process' ] );
	}

	/**
	 * Schedule the event.
	 *
	 * @param mixed[] ...$args Arguments passed to the function from the action hook.
	 */
	public function schedule_event( ...$args ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		if ( ! current_user_can( 'manage_options' ) ) {
			return;
		}

		$event_name = $this->get_event_name();
		$timestamp  = wp_next_scheduled( $event_name );

		if ( $timestamp ) {
			return;
		}

		wp_schedule_event( time(), $this->get_interval(), $event_name );
	}
}
