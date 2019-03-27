import React from 'react';
import { Modal, Form, Input, InputNumber, Divider } from 'antd';

const FormItem = Form.Item;

const ContactForm = Form.create()(
	(props) => {
		const { visible, onCancel, onAccept, form } = props;
		const { getFieldDecorator } = form;
		return (
			<div>
				<hr />
				<Modal
					visible={visible}
					title="Tic Tac Toe - Accept Challenge"
					okText="Accept"
					cancelText="Cancel"
					onCancel={onCancel}
					onOk={onAccept}
				>
					<Form layout="vertical">
						<p>To accept the game, choose a screen name and provide a random number to help secure the game.</p>
						<FormItem>
							{getFieldDecorator('playerNickname', {
								rules: [{ required: true, message: 'Please, choose a screen name' }],
							})(
								<Input placeholder="Player2 nickname" />
							)}
						</FormItem>
						<FormItem>
							{getFieldDecorator('number', {
								rules: [{ required: true, message: 'Please, enter a random number to secure your acceptance of the game' }],
							})(
								<InputNumber min={0} placeholder="Random number" />
							)}
						</FormItem>
					</Form>
				</Modal>
			</div>
		)
	}
)

export default ContactForm