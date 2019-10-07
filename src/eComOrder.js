import { postACItem } from './utils/requests'

import activeCampaignState from '../state'

const setActiveCartStatus = (order = {}, props = {}) => {
	delete order.externalcheckoutid
	delete order.abandoned_date
	order.externalid = props.externalid || Date.now()
}

const updateAbandonedOrder = async (order) => {
	console.log(`updateAbandonedOrder running...`)

	setActiveCartStatus(order)
	let ecomOrder
	await postACItem(`ecomOrderId`, order)
		.then(response => ecomOrder = response ? response.ecomOrder : null)

	console.log(`updateAbandonedOrder returning: `, ecomOrder)
	return ecomOrder
}

const completeAbandonedStateOrder = async () => {
	let ecomOrder
	if (activeCampaignState.state.activeCampaignOrder) {
		ecomOrder = await updateAbandonedOrder({ ...activeCampaignState.state.activeCampaignOrder })
		if (ecomOrder) activeCampaignState.setState({ activeCampaignOrder: null })
	}
	return ecomOrder
}

function ActiveCampaignEComOrder (props = {}) {
	// priority properties
	this.email = props.email
	this.totalPrice = props.totalPrice || 0
	this.orderNumber = props.orderNumber
	this.connectionid = props.connectionid
	this.customerid = props.customerid

	this.orderProducts = props.orderProducts && props.orderProducts.length ?
		props.orderProducts.map(product => {
			return {
				externalid: product.id,
				name: product.name,
				price: product.price,
				quantity: product.quantity,
				category: ``,
				sku: ``,
				description: product.description,
				imageUrl: product.image,
				productUrl: ``
			}
		})
		: []
	
	// external id is optional, will determine cart abandment
	this.externalid = props.externalid || null

	// optional properties (have default values)
	this.source = props.source || `1`
	this.orderUrl = props.orderUrl || ``
	this.shippingMethod = props.shippingMethod || `UPS Ground`
	this.shippingAmount = props.shippingAmount || 0
	this.taxAmount = props.taxAmount || 0
	this.discountAmount = props.discountAmount || 0
	this.currency = props.currency || `USD`	

	// values that are currently static and need to be updated
	this.externalCreatedDate = props.externalCreatedDate || `2019-09-30T17:41:39-04:00`
	this.externalUpdatedDate = props.externalUpdatedDate || `2019-09-30T17:41:39-04:00`

	this.requestJson = () => {
		return {
			ecomOrder: {
				...this
			}
		}
	}

	this.abandonCart = (props = {}) => {
		// TODO: Review the id and date
		// Add externalcheckoutid and abandoned_date to make cart abandonded
		delete this.externalid

		this.abandoned_date = `2019-09-30T17:41:39-04:00`
		this.externalcheckoutid =
			props.externalcheckoutid
			|| `${Date.now()}-${this.customerid}-${this.connectionid}`
	}

	this.createAbandonedOrder = async () => {
		console.log(`createAbandonedOrder running...`)

		this.abandonCart()
		let ecomOrder
		await postACItem(`ecomOrders`, this.requestJson())
			.then(response => ecomOrder = response ? response.ecomOrder : null)

		console.log(`createAbandonedOrder returning: `, ecomOrder)
		activeCampaignState.setState({ activeCampaignOrder: ecomOrder })
		return ecomOrder
	}
}

export {
	ActiveCampaignEComOrder,
	completeAbandonedStateOrder
} 